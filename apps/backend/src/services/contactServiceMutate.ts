import {
  mergeContacts as mergeContactRecords,
  type Contact,
  type User,
} from '@mms/shared';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { applyContactRelationshipInference } from './contactRelationshipInferenceService.js';
import { runInTransaction } from '../db/database.js';
import { canDeleteContacts } from './rbacService.js';
import {
  findContactById,
  saveContact,
} from '../db/repositories/contactRepository.js';
import {
  assertContactUniqueFields,
} from './contactUniqueValidationService.js';
import {
  ContactPermissionError,
  mergeContactPatch,
  prepareContactRecord,
  stripClientSoftDeleteFields,
} from './contactServiceNormalize.js';

export {
  ContactPermissionError,
  normalizeContactPhones,
  prepareContactRecord,
} from './contactServiceNormalize.js';
export type {
  ContactBulkRestoreConflict,
  ContactBulkRestoreResult,
} from './contactServiceSoftDelete.js';
export {
  restoreContactById,
  bulkRestoreContacts,
  softDeleteContactById,
  bulkSoftDeleteContacts,
} from './contactServiceSoftDelete.js';

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

export interface UpdateContactByIdOptions {
  language?: string;
  /**
   * When false, skip peer relationship graph writes.
   * Required for self-service profile updates without `contacts.write`.
   * @default true
   */
  applyRelationshipInference?: boolean;
}

export async function updateContactById(
  id: string,
  contact: Contact,
  languageOrOptions: string | UpdateContactByIdOptions = 'en',
): Promise<Contact | null> {
  const options: UpdateContactByIdOptions =
    typeof languageOrOptions === 'string'
      ? { language: languageOrOptions }
      : languageOrOptions;
  const language = options.language ?? 'en';
  const applyInference = options.applyRelationshipInference !== false;

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
    if (applyInference) {
      await applyContactRelationshipInference(tenant, saved);
    }
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
