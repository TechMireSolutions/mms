import { dedupeTrimmedIds, type Teacher } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { FacultyRepository as TeachersRepository } from '../repository/facultyRepository.js';
import { facultyRepository as teachersRepository } from '../repository/facultyRepositoryAdapter.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { isUniqueViolation } from '../../lib/pgErrors.js';
import { buildRestoredRecord, nowIso } from '../../lib/softDeleteHelpers.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';

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
        throw new ConflictError(`Employee ID ${existing.employeeId} is already in use by another active teacher`);
      }
    }

    const next = buildRestoredRecord(existing, userId);
    try {
      await repo.save(tenant, next);
    } catch (err: unknown) {
      if (isUniqueViolation(err) || (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505')) {
        throw new ConflictError('Cannot restore teacher: active record with this unique identifier already exists');
      }
      throw err;
    }

    const restoredAt = next.restoredAt ?? nowIso();
    await emitOutboxEvent('entity.restored', {
      entityType: 'faculty',
      entityId: String(id),
      tenantId: tenant,
      restoredAt,
      restoredBy: userId ?? 'unknown',
      version: Date.now(),
    });

    return next;
  });

  if (restored) {
    await broadcastCollection('faculty');
    await broadcastCollection('teachers');
  }
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
    const existingMap = new Map(existingTeachers.map((t) => [String(t.id), t]));

    for (const id of uniqueIds) {
      const existing = existingMap.get(id);
      if (!existing || !existing.deletedAt) {
        failed += 1;
        continue;
      }
      toSave.push(buildRestoredRecord(existing, userId));
      succeeded += 1;
    }

    if (toSave.length > 0) {
      try {
        await repo.bulkSave(tenant, toSave);
      } catch (err: unknown) {
        if (isUniqueViolation(err) || (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505')) {
          throw new ConflictError('Cannot restore teacher: active record with this unique identifier already exists');
        }
        throw err;
      }

      for (const t of toSave) {
        await emitOutboxEvent('entity.restored', {
          entityType: 'faculty',
          entityId: String(t.id),
          tenantId: tenant,
          restoredAt: t.restoredAt ?? nowIso(),
          restoredBy: userId ?? 'unknown',
          version: Date.now(),
        });
      }
    }
    return { succeeded, failed };
  });

  if (result.succeeded > 0) {
    await broadcastCollection('faculty');
    await broadcastCollection('teachers');
  }
  return result;
}
