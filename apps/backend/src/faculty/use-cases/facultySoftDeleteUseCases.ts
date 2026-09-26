import { dedupeTrimmedIds, type Faculty } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository } from '../repository/facultyRepository.js';
import { facultyRepository } from '../repository/facultyRepositoryAdapter.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { nowIso } from '../../lib/softDeleteHelpers.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { revokeFacultySessions } from './facultySoftDeleteSessions.js';
import { restoreFacultyById, bulkRestoreFaculty } from './facultyRestoreUseCases.js';

export { restoreFacultyById, bulkRestoreFaculty };

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
  repo: FacultyRepository,
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

export async function softDeleteFacultyById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
  repo: FacultyRepository = facultyRepository,
  reassignSubordinatesTo?: string,
): Promise<boolean> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: 1 };

    await guardSubordinatesOnDelete(tenant, id, reassignSubordinatesTo, repo);

    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Faculty[] = [];

    const existingFaculty = await repo.findByIds(tenant, [id]);
    const existing = existingFaculty[0];
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
      for (const f of toSave) {
        await emitOutboxEvent('entity.soft_deleted', {
          entityType: 'faculty',
          entityId: String(f.id),
          tenantId: tenant,
          deletedAt: f.deletedAt ?? now,
          deletedBy,
          deletionReason: f.deletionReason,
          version: Date.now(),
          snapshot: f,
        });
      }
      await revokeFacultySessions(tenant, toSave);
      return { succeeded: 1, failed: 0 };
    }
    return { succeeded: 0, failed: 1 };
  });

  if (result.succeeded > 0) {
    await broadcastCollection('faculty');
  }
  return result.succeeded === 1;
}

export async function bulkSoftDeleteFaculty(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
  repo: FacultyRepository = facultyRepository,
): Promise<{ succeeded: number; failed: number }> {
  const uniqueIds = dedupeTrimmedIds(ids);
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };
  const tenant = getRequestTenant();

  const result = await runInTransaction(async () => {
    if (!tenant) return { succeeded: 0, failed: uniqueIds.length };

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
    const toSave: Faculty[] = [];

    const existingFaculty = await repo.findByIds(tenant, uniqueIds);
    const existingMap = new Map(existingFaculty.map((f) => [String(f.id), f]));

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
      for (const f of toSave) {
        await emitOutboxEvent('entity.soft_deleted', {
          entityType: 'faculty',
          entityId: String(f.id),
          tenantId: tenant,
          deletedAt: f.deletedAt ?? now,
          deletedBy,
          deletionReason: f.deletionReason,
          version: Date.now(),
          snapshot: f,
        });
      }
      await revokeFacultySessions(tenant, toSave);
    }
    return { succeeded, failed };
  });

  if (result.succeeded > 0) {
    await broadcastCollection('faculty');
  }
  return result;
}
