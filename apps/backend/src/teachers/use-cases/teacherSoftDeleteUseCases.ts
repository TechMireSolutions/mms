import type { Teacher } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../services/websocketService.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';

function nowIso(): string {
  return new Date().toISOString();
}

/** Clears soft-delete metadata on a stored teacher row (restore). */
function restoredRow(existing: Teacher): Teacher {
  return {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    updatedAt: nowIso(),
  };
}

export async function restoreTeacherById(
  id: string,
  _restoredBy: string,
  repo: TeachersRepository = teachersRepository,
): Promise<Teacher | null> {
  const restored = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing) return null;
    if (!existing.deletedAt) return existing;

    const next = restoredRow(existing);
    await repo.save(tenant, next);
    return next;
  });
  if (restored) await broadcastCollection('teachers');
  return restored;
}

export async function bulkRestoreTeachers(
  ids: string[],
  _restoredBy: string,
  repo: TeachersRepository = teachersRepository,
): Promise<{ succeeded: number; failed: number }> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingTeachers.map((teacher) => [String(teacher.id), teacher]));

    for (const id of ids) {
      const existing = existingMap.get(String(id));
      if (!existing || !existing.deletedAt) {
        failed += 1;
        continue;
      }
      toSave.push(restoredRow(existing));
      succeeded += 1;
    }

    if (toSave.length > 0) {
      await repo.bulkSave(tenant, toSave);
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('teachers');
  return result;
}

export async function softDeleteTeacherById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<boolean> {
  const result = await bulkSoftDeleteTeachers([id], deletedBy, deletionReason, repo);
  return result.succeeded === 1;
}

export async function bulkSoftDeleteTeachers(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<{ succeeded: number; failed: number }> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingTeachers.map((teacher) => [String(teacher.id), teacher]));

    for (const id of ids) {
      const existing = existingMap.get(String(id));
      if (existing && !existing.deletedAt) {
        toSave.push({
          ...existing,
          deletedAt: now,
          deletedBy,
          deletionReason: trimmedReason || undefined,
        });
        succeeded += 1;
      } else {
        failed += 1;
      }
    }

    if (toSave.length > 0) {
      await repo.bulkSave(tenant, toSave);
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('teachers');
  return result;
}
