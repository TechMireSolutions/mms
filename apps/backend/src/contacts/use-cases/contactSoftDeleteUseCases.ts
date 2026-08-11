import type { Contact } from '@mms/shared';
import { invalidateDuplicateScanCache } from './contactDuplicateScanUseCases.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import {
  assertContactUniqueFields,
  ContactUniqueFieldError,
} from './contactUniqueFieldUseCases.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

interface ContactBulkRestoreConflict {
  id: string;
  errors: ContactUniqueFieldError['errors'];
}

interface ContactBulkRestoreResult {
  succeeded: number;
  failed: number;
  conflicts: ContactBulkRestoreConflict[];
}

export async function restoreContactById(
  id: string,
  repo: ContactsRepository = contactsRepository,
): Promise<Contact | null> {
  const restored = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing) return null;
    if (!existing.deletedAt) return existing;

    const now = new Date().toISOString();
    const next: Contact = {
      ...existing,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      updatedAt: now,
    };
    await assertContactUniqueFields(tenant, next, 'en', [], repo);
    await repo.save(tenant, next);
    await invalidateDuplicateScanCache();
    return next;
  });
  if (restored) await broadcastCollection('contacts');
  return restored;
}

export async function bulkRestoreContacts(
  ids: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<ContactBulkRestoreResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length, conflicts: [] };
    let succeeded = 0;
    let failed = 0;
    const conflicts: ContactBulkRestoreConflict[] = [];
    const now = new Date().toISOString();
    const toSave: Contact[] = [];
    const accepted: Contact[] = [];

    const existingContacts = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingContacts.map((c) => [c.id, c]));

    for (const id of ids) {
      const existing = existingMap.get(id);
      if (!(existing && existing.deletedAt)) {
        failed += 1;
        continue;
      }
      const restored: Contact = {
        ...existing,
        deletedAt: undefined,
        deletedBy: undefined,
        deletionReason: undefined,
        updatedAt: now,
      };
      try {
        await assertContactUniqueFields(tenant, restored, {
          language: 'en',
          additionalPeers: accepted,
        }, [], repo);
        toSave.push(restored);
        accepted.push(restored);
        succeeded += 1;
      } catch (error) {
        if (error instanceof ContactUniqueFieldError) {
          failed += 1;
          conflicts.push({ id: String(id), errors: error.errors });
          continue;
        }
        throw error;
      }
    }

    if (toSave.length > 0) {
      await repo.bulkSave(tenant, toSave);
      await invalidateDuplicateScanCache();
    }
    return { succeeded, failed, conflicts };
  });
  if (result.succeeded > 0) await broadcastCollection('contacts');
  return result;
}

export async function softDeleteContactById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
  repo: ContactsRepository = contactsRepository,
): Promise<boolean> {
  const result = await bulkSoftDeleteContacts([id], deletedBy, deletionReason, repo);
  return result.succeeded === 1;
}

export async function bulkSoftDeleteContacts(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
  repo: ContactsRepository = contactsRepository,
): Promise<{ succeeded: number; failed: number }> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const now = new Date().toISOString();
    const trimmedReason = deletionReason?.trim();
    const toSave: Contact[] = [];

    const existingContacts = await repo.findByIds(tenant, ids);
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
      await repo.bulkSave(tenant, toSave);
      await invalidateDuplicateScanCache();
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('contacts');
  return result;
}
