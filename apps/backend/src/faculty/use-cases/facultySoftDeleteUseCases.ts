import { dedupeTrimmedIds, type Teacher } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository as TeachersRepository } from '../repository/facultyRepository.js';
import { facultyRepository as teachersRepository } from '../repository/facultyRepositoryAdapter.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { nowIso } from '../../lib/softDeleteHelpers.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { revokeFacultySessions } from './facultySoftDeleteSessions.js';
import { restoreTeacherById, bulkRestoreTeachers } from './facultyRestoreUseCases.js';

export { restoreTeacherById, bulkRestoreTeachers };

export class SubordinateReassignmentError extends ConflictError {
  constructor(message = 'Cannot delete faculty member with active subordinates. Please reassign subordinates before deletion.') {
    super(message);
    this.name = 'SubordinateReassignmentError';
  }
}

async function guardSubordinatesOnDelete(
  tenant: string,
  id: string,
  reassignSubordinatesTo: string | undefined,
  repo: TeachersRepository,
): Promise<void> {
  const subordinateCount = repo.countSubordinates ? await repo.countSubordinates(tenant, id) : 0;
  if (subordinateCount === 0) return;

  if (reassignSubordinatesTo && reassignSubordinatesTo.trim()) {
    const targetId = reassignSubordinatesTo.trim();
    if (targetId === id) {
      throw new ConflictError('Cannot reassign subordinates to the faculty member being deleted');
    }
    const targetSupervisor = await repo.findById(tenant, targetId);
    if (!targetSupervisor || targetSupervisor.deletedAt) {
      throw new ConflictError('Target supervisor for reassignment does not exist or has been deleted');
    }
    await repo.reassignSubordinates(tenant, id, targetId);
  } else {
    throw new SubordinateReassignmentError(
      `Cannot delete faculty member with ${subordinateCount} active subordinate(s). Please reassign subordinates before deletion.`,
    );
  }
}

export async function softDeleteTeacherById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
  repo: TeachersRepository = teachersRepository,
  reassignSubordinatesTo?: string,
): Promise<boolean> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: 1 };

    // C-2 fix: guard runs inside the transaction so subordinate counts and
    // reassignment are atomic with the soft-delete write.
    await guardSubordinatesOnDelete(tenant, id, reassignSubordinatesTo, repo);

    const uniqueIds = [id];
    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, uniqueIds);
    const existingMap = new Map(existingTeachers.map((t) => [String(t.id), t]));

    const existing = existingMap.get(id);
    if (existing && !existing.deletedAt) {
      toSave.push({
        ...existing,
        deletedAt: now,
        deletedBy,
        deletionReason: trimmedReason || undefined,
      });
    }

    if (toSave.length > 0) {
      await repo.bulkSave(tenant, toSave);
      for (const t of toSave) {
        await emitOutboxEvent('entity.soft_deleted', {
          entityType: 'faculty',
          entityId: String(t.id),
          tenantId: tenant,
          deletedAt: t.deletedAt ?? now,
          deletedBy,
          deletionReason: t.deletionReason,
          version: Date.now(),
          snapshot: t,
        });
      }
      await revokeFacultySessions(tenant, toSave);
      return { succeeded: 1, failed: 0 };
    }
    return { succeeded: 0, failed: 1 };
  });

  if (result.succeeded > 0) {
    await broadcastCollection('faculty');
    await broadcastCollection('teachers');
  }
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
  const tenant = getRequestTenant();

  const result = await runInTransaction(async () => {
    if (!tenant) return { succeeded: 0, failed: uniqueIds.length };

    // m-1 fix: subordinate check moved inside the transaction so the count and
    // soft-delete write are atomic — closing the TOCTOU window.
    if (repo.countSubordinatesBatch) {
      const subCounts = await repo.countSubordinatesBatch(tenant, uniqueIds);
      const getCount = (id: string): number => {
        if (!subCounts) return 0;
        if (subCounts instanceof Map) return subCounts.get(id) ?? 0;
        return (subCounts as Record<string, number>)[id] ?? 0;
      };
      const supervisorIdsWithSubs = uniqueIds.filter((id) => getCount(id) > 0);
      if (supervisorIdsWithSubs.length > 0) {
        const deletedIdSet = new Set(uniqueIds);
        for (const supId of supervisorIdsWithSubs) {
          const subs = repo.findSubordinates ? await repo.findSubordinates(tenant, supId) : [];
          const activeOrphaned = subs.filter((sub) => !sub.deletedAt && !deletedIdSet.has(String(sub.id)));
          if (activeOrphaned.length > 0) {
            throw new SubordinateReassignmentError(
              `Cannot delete faculty member (${supId}) with ${activeOrphaned.length} active subordinate(s). Please reassign subordinates before deletion.`,
            );
          }
        }
      }
    }

    let succeeded = 0;
    let failed = 0;
    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Teacher[] = [];

    const existingTeachers = await repo.findByIds(tenant, uniqueIds);
    const existingMap = new Map(existingTeachers.map((t) => [String(t.id), t]));

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
      for (const t of toSave) {
        await emitOutboxEvent('entity.soft_deleted', {
          entityType: 'faculty',
          entityId: String(t.id),
          tenantId: tenant,
          deletedAt: t.deletedAt ?? now,
          deletedBy,
          deletionReason: t.deletionReason,
          version: Date.now(),
          snapshot: t,
        });
      }
      await revokeFacultySessions(tenant, toSave);
    }
    return { succeeded, failed };
  });

  if (result.succeeded > 0) {
    await broadcastCollection('faculty');
    await broadcastCollection('teachers');
  }
  return result;
}


export const restoreFacultyById = restoreTeacherById;
export const bulkRestoreFaculty = bulkRestoreTeachers;
export const softDeleteFacultyById = softDeleteTeacherById;
export const bulkSoftDeleteFaculty = bulkSoftDeleteTeachers;
