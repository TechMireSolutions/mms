import { dedupeTrimmedIds, type Teacher } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { isUniqueViolation } from '../../lib/pgErrors.js';

function nowIso(): string {
  return new Date().toISOString();
}

/** Clears soft-delete metadata on a stored teacher row (restore). */
function restoredRow(existing: Teacher, userId?: string): Teacher {
  return {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    restoredAt: nowIso(),
    restoredBy: userId,
    updatedAt: nowIso(),
  };
}

export async function restoreTeacherById(
  id: string,
  userId?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<Teacher | null> {
  const restored = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing) return null;
    if (!existing.deletedAt) return existing;

    if (existing.employeeId) {
      const conflict = await repo.findRegistrationConflict(tenant, {
        excludeId: id,
        employeeId: existing.employeeId,
      });
      if (conflict === 'employeeId') {
        throw new ConflictError(
          `Employee ID ${existing.employeeId} is already in use by another active teacher`,
        );
      }
    }

    const next = restoredRow(existing, userId);
    try {
      await repo.save(tenant, next);
    } catch (err: unknown) {
      if (
        isUniqueViolation(err) ||
        (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505')
      ) {
        throw new ConflictError(
          'Cannot restore teacher: active record with this unique identifier already exists',
        );
      }
      throw err;
    }
    return next;
  });
  if (restored) await broadcastCollection('teachers');
  return restored;
}

export async function bulkRestoreTeachers(
  ids: string[],
  userId?: string,
  repo: TeachersRepository = teachersRepository,
): Promise<{ succeeded: number; failed: number }> {
  const uniqueIds = dedupeTrimmedIds(ids);
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: uniqueIds.length };
    let succeeded = 0;
    let failed = 0;
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, uniqueIds);
    const existingMap = new Map(existingTeachers.map((teacher) => [String(teacher.id), teacher]));

    for (const id of uniqueIds) {
      const existing = existingMap.get(id);
      if (!existing || !existing.deletedAt) {
        failed += 1;
        continue;
      }
      toSave.push(restoredRow(existing, userId));
      succeeded += 1;
    }

    if (toSave.length > 0) {
      try {
        await repo.bulkSave(tenant, toSave);
      } catch (err: unknown) {
        if (
          isUniqueViolation(err) ||
          (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505')
        ) {
          throw new ConflictError(
            'Cannot restore teacher: active record with this unique identifier already exists',
          );
        }
        throw err;
      }
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
  const uniqueIds = dedupeTrimmedIds(ids);
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: uniqueIds.length };
    let succeeded = 0;
    let failed = 0;
    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, uniqueIds);
    const existingMap = new Map(existingTeachers.map((teacher) => [String(teacher.id), teacher]));

    for (const id of uniqueIds) {
      const existing = existingMap.get(id);
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
      try {
        const { revokeAllUserSessions, revokeUserSessionKeys } = await import('../../services/session.service.js');
        const { listAllTenantUsersByWorkspace } = await import(
          '../../db/repositories/tenantUserRepository.js'
        );
        for (const t of toSave) {
          await revokeAllUserSessions(String(t.id));
          await revokeUserSessionKeys(String(t.id));
        }
        const contactIds = new Set(toSave.map((t) => t.contactId).filter(Boolean));
        if (contactIds.size > 0) {
          const tenantUsersList = await listAllTenantUsersByWorkspace(tenant);
          for (const u of tenantUsersList) {
            if (u.contactId && contactIds.has(String(u.contactId))) {
              await revokeAllUserSessions(u.id);
              await revokeUserSessionKeys(u.id);
            }
          }
        }
        const directUserIds = toSave
          .map((t) => (t as unknown as { userId?: string }).userId)
          .filter((uid): uid is string => Boolean(uid && uid.trim()));
        for (const uid of directUserIds) {
          await revokeAllUserSessions(uid);
          await revokeUserSessionKeys(uid);
        }
      } catch {
        // Non-blocking in decoupled unit tests
      }
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('teachers');
  return result;
}
