import {
  applyTitleCaseToContact,
  mergeContacts as mergeContactRecords,
  normalizeToE164,
  parsePhoneNumber,
  stripContactClientSoftDeleteFields,
  stripContactRetiredClassificationFields,
  type Contact,
  type User,
} from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { applyContactRelationshipInference } from './contactRelationshipInferenceService.js';
import { runInTransaction } from '../db/database.js';
import { canDeleteContacts } from './rbacService.js';
import {
  findContactById,
  saveContact,
  findContactsByIds,
  bulkSaveContacts,
} from '../db/repositories/contactRepository.js';
import {
  loadContactRuntimeDefaults,
} from './contactServiceLoad.js';
import { assertContactUniqueFields } from './contactUniqueValidationService.js';

function stripClientSoftDeleteFields(contact: Contact): Contact {
  return stripContactClientSoftDeleteFields(contact as unknown as Record<string, unknown>) as Contact;
}

export class ContactPermissionError extends Error {
  readonly code = 'forbidden' as const;

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'ContactPermissionError';
  }
}

/** Merge a client patch onto an existing contact, ignoring undefined keys. */
function mergeContactPatch(existing: Contact, patch: Contact): Contact {
  const next: Contact = { ...existing };
  for (const [key, value] of Object.entries(patch) as [keyof Contact, Contact[keyof Contact]][]) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key as string] = value;
    }
  }
  return next;
}

export async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  let phones = contact.phones;
  const scalarPhone = typeof contact.phone === 'string' ? contact.phone.trim() : '';
  const { defaultPhoneCountryCode, phoneLabel } = await loadContactRuntimeDefaults();
  const dialDefault = defaultPhoneCountryCode || '';
  const labelDefault = phoneLabel || '';

  if ((!phones || !phones.length) && scalarPhone) {
    phones = [{
      label: labelDefault,
      number: scalarPhone,
      countryCode: dialDefault,
      isPrimary: true,
    }];
  }

  if (!phones?.length) {
    return { ...contact, phones: phones || [] };
  }
  const countryCodes = (await fetchCollection('countryCodes')) || [];
  const knownCodes = countryCodes
    .map((row) => (row && typeof row === 'object' && typeof (row as { code?: unknown }).code === 'string' ? String((row as { code: string }).code) : ''))
    .filter(Boolean);

  return {
    ...contact,
    phones: phones.map((phone) => {
      const fallbackCode = phone.countryCode || dialDefault;
      const trimmedNumber = (phone.number || '').trim();
      const parsedRaw = parsePhoneNumber(trimmedNumber, fallbackCode, knownCodes);
      const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
      const parsed = parsePhoneNumber(e164, parsedRaw.countryCode, knownCodes);
      return {
        ...phone,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

export async function prepareContactRecord(contact: Contact, id?: string | number): Promise<Contact> {
  const stripped = stripClientSoftDeleteFields(contact);
  const withPhones = await normalizeContactPhones(stripped);
  const resolvedId = id ?? withPhones.id ?? `temp-${Date.now()}`;
  const titled = applyTitleCaseToContact({ ...withPhones, id: resolvedId }) as Contact;
  return stripContactRetiredClassificationFields({ ...titled }) as Contact;
}

export interface UpsertContactOptions {
  user?: User;
  canRestore?: boolean;
  /** Accept-Language for unique-field conflict messages. */
  language?: string;
}

export async function upsertContact(
  contact: Contact,
  options?: User | UpsertContactOptions,
): Promise<{
  contact: Contact;
  created: boolean;
  restoredFromDelete?: boolean;
}> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const existing = await findContactById(tenant, String(contact.id ?? ''));
    const created = !existing;
    const restoredFromDelete = existing && Boolean(existing.deletedAt);

    const opts = options && !('role' in options) ? (options as UpsertContactOptions) : undefined;
    const user = options && 'role' in options ? (options as User) : opts?.user;
    const explicitCanRestore = opts?.canRestore;
    const language = opts?.language || 'en';

    if (restoredFromDelete) {
      if (explicitCanRestore === false) {
        throw new ContactPermissionError('Restoring soft-deleted contacts requires delete permissions');
      }
      if (user && !canDeleteContacts(user)) {
        throw new ContactPermissionError('Restoring soft-deleted contacts requires delete permissions');
      }
    }

    const stripped = stripClientSoftDeleteFields(contact);
    const mergedInput = existing ? mergeContactPatch(existing, stripped) : stripped;
    const contactWithId = await prepareContactRecord(mergedInput, contact.id ?? existing?.id);
    await assertContactUniqueFields(tenant, contactWithId, language);
    const saved: Contact = created
      ? contactWithId
      : {
          ...contactWithId,
          deletedAt: undefined,
          deletedBy: undefined,
          deletionReason: undefined,
        };

    await saveContact(tenant, saved);
    await applyContactRelationshipInference(tenant, saved);
    await invalidateDuplicateScanCache();
    return { contact: saved, created, restoredFromDelete: restoredFromDelete || undefined };
  });
}

export async function updateContactById(
  id: string,
  contact: Contact,
  language = 'en',
): Promise<Contact | null> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await findContactById(tenant, id);
    if (!existing || existing.deletedAt) {
      return null;
    }
    const stripped = stripClientSoftDeleteFields({ ...contact, id });
    const contactWithId = await prepareContactRecord(mergeContactPatch(existing, stripped), id);
    await assertContactUniqueFields(tenant, contactWithId, language);
    const saved: Contact = {
      ...contactWithId,
      id,
      deletedAt: existing.deletedAt,
      deletedBy: existing.deletedBy,
      deletionReason: existing.deletionReason,
    };
    await saveContact(tenant, saved);
    await applyContactRelationshipInference(tenant, saved);
    await invalidateDuplicateScanCache();
    return saved;
  });
}

export async function mergeContactsById(
  keepId: string,
  deleteId: string,
  mergedInput: Contact | undefined,
  deletedBy: string,
): Promise<Contact> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    if (String(keepId) === String(deleteId)) {
      throw new Error('Cannot merge a contact into itself');
    }

    const keep = await findContactById(tenant, keepId);
    const other = await findContactById(tenant, deleteId);
    if (!keep || keep.deletedAt) throw new Error('Keep contact not found');
    if (!other || other.deletedAt) throw new Error('Delete contact not found');

    const mergedSource = mergedInput
      ? { ...mergedInput, id: keepId }
      : mergeContactRecords(keep, other);
    const prepared = await prepareContactRecord(mergedSource, keepId);
    // Exclude the contact being merged away — its values may move onto keep.
    await assertContactUniqueFields(tenant, prepared, 'en', [deleteId]);
    const saved: Contact = {
      ...keep,
      ...prepared,
      id: keepId,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      updatedAt: new Date().toISOString(),
    };

    await saveContact(tenant, saved);
    await applyContactRelationshipInference(tenant, saved);

    const now = new Date().toISOString();
    await saveContact(tenant, {
      ...other,
      deletedAt: now,
      deletedBy,
      deletionReason: `Merged into ${keepId}`,
      updatedAt: now,
    });

    await invalidateDuplicateScanCache();
    return saved;
  });
}

export async function restoreContactById(id: string, restoredBy: string): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findContactById(tenant, id);
  if (!existing) return null;
  if (!existing.deletedAt) return existing;

  const result = await bulkRestoreContacts([id], restoredBy);
  if (result.succeeded === 1) {
    return findContactById(tenant, id);
  }
  return null;
}

export async function bulkRestoreContacts(
  ids: string[],
  _restoredBy: string,
): Promise<{ succeeded: number; failed: number }> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const now = new Date().toISOString();
    const toSave: Contact[] = [];

    const existingContacts = await findContactsByIds(tenant, ids);
    const existingMap = new Map(existingContacts.map((c) => [c.id, c]));

    for (const id of ids) {
      const existing = existingMap.get(id);
      if (existing && existing.deletedAt) {
        const restored: Contact = {
          ...existing,
          deletedAt: undefined,
          deletedBy: undefined,
          deletionReason: undefined,
          updatedAt: now,
        };
        toSave.push(restored);
        succeeded += 1;
      } else {
        failed += 1;
      }
    }

    if (toSave.length > 0) {
      await bulkSaveContacts(tenant, toSave);
      await invalidateDuplicateScanCache();
    }
    return { succeeded, failed };
  });
}

export async function softDeleteContactById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const result = await bulkSoftDeleteContacts([id], deletedBy, deletionReason);
  return result.succeeded === 1;
}

export async function bulkSoftDeleteContacts(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const now = new Date().toISOString();
    const trimmedReason = deletionReason?.trim();
    const toSave: Contact[] = [];

    const existingContacts = await findContactsByIds(tenant, ids);
    const existingMap = new Map(existingContacts.map((c) => [c.id, c]));

    for (const id of ids) {
      const existing = existingMap.get(id);
      if (existing && !existing.deletedAt) {
        const updated: Contact = {
          ...existing,
          deletedAt: now,
          deletedBy,
          deletionReason: trimmedReason || undefined,
        };
        toSave.push(updated);
        succeeded += 1;
      } else {
        failed += 1;
      }
    }

    if (toSave.length > 0) {
      await bulkSaveContacts(tenant, toSave);
      await invalidateDuplicateScanCache();
    }
    return { succeeded, failed };
  });
}
