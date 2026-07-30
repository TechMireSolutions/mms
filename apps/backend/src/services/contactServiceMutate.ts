import {
  applyTitleCaseToContact,
  parsePhoneNumber,
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

export async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  let phones = contact.phones;
  const scalarPhone = typeof contact.phone === 'string' ? contact.phone.trim() : '';

  if ((!phones || !phones.length) && scalarPhone) {
    phones = [{ label: 'Mobile', number: scalarPhone, countryCode: '+92', isPrimary: true }];
  }

  if (!phones?.length) {
    return { ...contact, phones: phones || [] };
  }
  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  const countryCodes = (await fetchCollection('countryCodes')) || [];
  const knownCodes = countryCodes
    .map((row) => (row && typeof row === 'object' && typeof (row as { code?: unknown }).code === 'string' ? String((row as { code: string }).code) : ''))
    .filter(Boolean);

  return {
    ...contact,
    phones: phones.map((phone) => {
      const fallbackCode = phone.countryCode || defaultPhoneCountryCode;
      const trimmedNumber = (phone.number || '').trim();
      const parsed = parsePhoneNumber(trimmedNumber, fallbackCode, knownCodes);
      return {
        ...phone,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

export async function prepareContactRecord(contact: Contact, id?: string | number): Promise<Contact> {
  const withPhones = await normalizeContactPhones(contact);
  const resolvedId = id ?? withPhones.id ?? `temp-${Date.now()}`;
  const titled = applyTitleCaseToContact({ ...withPhones, id: resolvedId }) as Contact;
  return stripContactRetiredClassificationFields({ ...titled }) as Contact;
}

export interface UpsertContactOptions {
  user?: User;
  canRestore?: boolean;
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
    const contactWithId = await prepareContactRecord(contact, contact.id);
    const existing = await findContactById(tenant, String(contactWithId.id));
    const created = !existing;
    const restoredFromDelete = existing && Boolean(existing.deletedAt);

    const user = options && 'role' in options ? (options as User) : (options as UpsertContactOptions)?.user;
    const explicitCanRestore = options && !('role' in options) ? (options as UpsertContactOptions)?.canRestore : undefined;

    if (restoredFromDelete) {
      if (explicitCanRestore === false) {
        throw new Error('Permission denied: Restoring soft-deleted contacts requires delete permissions');
      }
      if (user && !canDeleteContacts(user)) {
        throw new Error('Permission denied: Restoring soft-deleted contacts requires delete permissions');
      }
    }

    let saved: Contact;
    if (created) {
      saved = contactWithId;
    } else {
      saved = { ...existing, ...contactWithId, deletedAt: undefined, deletedBy: undefined };
    }

    await saveContact(tenant, saved);
    await applyContactRelationshipInference(tenant, saved);
    await invalidateDuplicateScanCache();
    return { contact: saved, created, restoredFromDelete: restoredFromDelete || undefined };
  });
}

export async function updateContactById(id: string, contact: Contact): Promise<Contact | null> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await findContactById(tenant, id);
    if (!existing || existing.deletedAt) {
      return null;
    }
    const contactWithId = await prepareContactRecord({ ...contact, id }, id);
    await saveContact(tenant, contactWithId);
    await applyContactRelationshipInference(tenant, contactWithId);
    await invalidateDuplicateScanCache();
    return contactWithId;
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
