import {
  mergeContacts as mergeContactRecords,
  type Contact,
  type User,
} from '@mms/shared';
import { invalidateDuplicateScanCache } from './contactDuplicateScanUseCases.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { applyContactRelationshipInference } from './contactRelationshipInferenceUseCases.js';
import { runInTransaction } from '../../db/database.js';
import { canDeleteContacts } from '../../lib/rbacCanHelpers.js';
import {
  assertContactUniqueFields,
} from './contactUniqueFieldUseCases.js';
import {
  ContactPermissionError,
  mergeContactPatch,
  prepareContactRecord,
  stripClientSoftDeleteFields,
} from './contactNormalizeUseCases.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

interface UpsertContactOptions {
  user?: User;
  canRestore?: boolean;
  /** Accept-Language for unique-field conflict messages. */
  language?: string;
}

export async function upsertContact(
  contact: Contact,
  options?: User | UpsertContactOptions,
  repo: ContactsRepository = contactsRepository,
): Promise<{
  contact: Contact;
  created: boolean;
  restoredFromDelete?: boolean;
}> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const existing = await repo.findById(tenant, String(contact.id ?? ''));
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
    await assertContactUniqueFields(tenant, contactWithId, language, [], repo);
    const saved: Contact = created
      ? contactWithId
      : {
          ...contactWithId,
          deletedAt: undefined,
          deletedBy: undefined,
          deletionReason: undefined,
        };

    await repo.save(tenant, saved);
    await applyContactRelationshipInference(tenant, saved, undefined, repo);
    await invalidateDuplicateScanCache();
    return { contact: saved, created, restoredFromDelete: restoredFromDelete || undefined };
  });
  await broadcastCollection('contacts');
  return result;
}

interface UpdateContactByIdOptions {
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
  repo: ContactsRepository = contactsRepository,
): Promise<Contact | null> {
  const options: UpdateContactByIdOptions =
    typeof languageOrOptions === 'string'
      ? { language: languageOrOptions }
      : languageOrOptions;
  const language = options.language ?? 'en';
  const applyInference = options.applyRelationshipInference !== false;

  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) {
      return null;
    }
    const stripped = stripClientSoftDeleteFields({ ...contact, id });
    const contactWithId = await prepareContactRecord(mergeContactPatch(existing, stripped), id);
    await assertContactUniqueFields(tenant, contactWithId, language, [], repo);
    const next: Contact = {
      ...contactWithId,
      id,
      deletedAt: existing.deletedAt,
      deletedBy: existing.deletedBy,
      deletionReason: existing.deletionReason,
    };
    await repo.save(tenant, next);
    if (applyInference) {
      await applyContactRelationshipInference(tenant, next, undefined, repo);
    }
    await invalidateDuplicateScanCache();
    return next;
  });
  if (saved) await broadcastCollection('contacts');
  return saved;
}

export async function mergeContactsById(
  keepId: string,
  deleteId: string,
  mergedInput: Contact | undefined,
  deletedBy: string,
  repo: ContactsRepository = contactsRepository,
): Promise<Contact> {
  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    if (String(keepId) === String(deleteId)) {
      throw new Error('Cannot merge a contact into itself');
    }
    const keep = await repo.findById(tenant, keepId);
    const other = await repo.findById(tenant, deleteId);
    if (!keep || keep.deletedAt) throw new Error('Keep contact not found');
    if (!other || other.deletedAt) throw new Error('Delete contact not found');

    const mergedSource = mergedInput
      ? { ...mergedInput, id: keepId }
      : mergeContactRecords(keep, other);
    const prepared = await prepareContactRecord(mergedSource, keepId);
    await assertContactUniqueFields(tenant, prepared, 'en', [deleteId], repo);
    const next: Contact = {
      ...keep,
      ...prepared,
      id: keepId,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      updatedAt: new Date().toISOString(),
    };

    await repo.save(tenant, next);
    await applyContactRelationshipInference(tenant, next, undefined, repo);

    const now = new Date().toISOString();
    await repo.save(tenant, {
      ...other,
      deletedAt: now,
      deletedBy,
      deletionReason: `Merged into ${keepId}`,
      updatedAt: now,
    });

    await repo.reparentContactReferences(tenant, keepId, deleteId);

    await invalidateDuplicateScanCache();
    return next;
  });
  await broadcastCollection('contacts');
  return saved;
}

/** Bulk persist pre-validated contacts (Google sync batch import) through the storage gateway. */
export async function bulkSaveContacts(
  contacts: Contact[],
  repo: ContactsRepository = contactsRepository,
): Promise<void> {
  const tenant = getRequestTenant();
  if (!tenant || contacts.length === 0) return;
  await repo.bulkSave(tenant, contacts);
}
