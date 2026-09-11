import type { Student } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../lib/livePush.js';
import type { StudentsRepository } from '../repository/studentsRepository.js';
import { studentsRepository } from '../repository/studentsRepositoryAdapter.js';
import { StudentRestoreConflictError } from './studentNormalizeUseCases.js';
import { isUniqueViolation } from '../../lib/pgErrors.js';
import { emitOutboxEvent } from '../../services/outboxEventService.js';
import { recordModernAuditEvent } from '../../services/auditTrailService.js';
import { buildStudentForensicSnapshot } from '../../services/forensicSnapshotService.js';


interface StudentBulkRestoreConflict {
  id: string;
  errors: Array<{ field: string; message: string }>;
}

interface StudentBulkRestoreResult {
  succeeded: number;
  failed: number;
  conflicts: StudentBulkRestoreConflict[];
}

import { buildRestoredRecord, nowIso } from '../../lib/softDeleteHelpers.js';

export async function restoreStudentById(
  id: string,
  userId?: string,
  repo: StudentsRepository = studentsRepository,
): Promise<Student | null> {
  const restored = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing) return null;
    if (!existing.deletedAt) return existing;

    const conflict = await repo.findRegistrationConflict(tenant, {
      excludeId: id,
      grNumber: existing.grNumber,
    });
    if (conflict === 'grNumber') {
      throw new StudentRestoreConflictError();
    }

    const next = buildRestoredRecord(existing, userId);
    try {
      await repo.save(tenant, next);
    } catch (err: unknown) {
      if (
        isUniqueViolation(err) ||
        (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505')
      ) {
        throw new StudentRestoreConflictError();
      }
      throw err;
    }

    const restoredAt = next.restoredAt ?? new Date().toISOString();
    // Emit CDC outbox and audit within the same transaction (activeDb() resolves
    // to the in-flight transaction via AsyncLocalStorage).
    await emitOutboxEvent('entity.restored', {
      entityType: 'students',
      entityId: String(id),
      tenantId: tenant,
      restoredAt,
      restoredBy: userId ?? 'unknown',
      version: Date.now(),
    });
    await recordModernAuditEvent({
      workspaceSubdomain: tenant,
      tableName: 'students',
      recordId: String(id),
      actionType: 'RESTORE',
      newState: next,
      minimizeDelta: false,
    });
    return next;
  });
  if (restored) await broadcastCollection('students');
  return restored;
}

export async function bulkRestoreStudents(
  ids: string[],
  userId?: string,
  repo: StudentsRepository = studentsRepository,
): Promise<StudentBulkRestoreResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length, conflicts: [] };
    let succeeded = 0;
    let failed = 0;
    const conflicts: StudentBulkRestoreConflict[] = [];
    const toSave: Student[] = [];

    const existingStudents = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingStudents.map((student) => [String(student.id), student]));
    const acceptedGrNumbers = new Set<string>();

    for (const id of ids) {
      const existing = existingMap.get(String(id));
      if (!existing || !existing.deletedAt) {
        failed += 1;
        continue;
      }
      const normalizedGr = existing.grNumber ? existing.grNumber.trim().toLowerCase() : null;
      if (normalizedGr && acceptedGrNumbers.has(normalizedGr)) {
        failed += 1;
        conflicts.push({
          id: String(id),
          errors: [{ field: 'grNumber', message: 'A student with this GR number already exists' }],
        });
        continue;
      }
      const conflict = await repo.findRegistrationConflict(tenant, {
        excludeId: String(id),
        grNumber: existing.grNumber,
      });
      if (conflict === 'grNumber') {
        failed += 1;
        conflicts.push({
          id: String(id),
          errors: [{ field: 'grNumber', message: 'A student with this GR number already exists' }],
        });
        continue;
      }
      const restored = buildRestoredRecord(existing, userId);
      toSave.push(restored);
      if (normalizedGr) acceptedGrNumbers.add(normalizedGr);
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
          throw new StudentRestoreConflictError();
        }
        throw err;
      }

      // Emit CDC outbox + audit for each successfully restored student
      const restoredAt = new Date().toISOString();
      for (const s of toSave) {
        await emitOutboxEvent('entity.restored', {
          entityType: 'students',
          entityId: String(s.id),
          tenantId: tenant,
          restoredAt,
          restoredBy: userId ?? 'unknown',
          version: Date.now(),
        });
        await recordModernAuditEvent({
          workspaceSubdomain: tenant,
          tableName: 'students',
          recordId: String(s.id),
          actionType: 'RESTORE',
          newState: s,
          minimizeDelta: false,
        });
      }
    }
    return { succeeded, failed, conflicts };
  });
  if (result.succeeded > 0) await broadcastCollection('students');
  return result;
}

export async function softDeleteStudentById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
  repo: StudentsRepository = studentsRepository,
): Promise<boolean> {
  const result = await bulkSoftDeleteStudents([id], deletedBy, deletionReason, repo);
  return result.succeeded === 1;
}

export async function bulkSoftDeleteStudents(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
  repo: StudentsRepository = studentsRepository,
): Promise<{ succeeded: number; failed: number }> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length };
    let succeeded = 0;
    let failed = 0;
    const now = nowIso();
    const trimmedReason = deletionReason?.trim();
    const toSave: Student[] = [];

    const existingStudents = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingStudents.map((student) => [String(student.id), student]));

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

      // Emit CDC outbox + audit for each archived student within the same tx
      for (const s of toSave) {
        await emitOutboxEvent('entity.soft_deleted', {
          entityType: 'students',
          entityId: String(s.id),
          tenantId: tenant,
          deletedAt: s.deletedAt ?? now,
          deletedBy: deletedBy,
          deletionReason: s.deletionReason,
          version: Date.now(),
          snapshot: buildStudentForensicSnapshot(s),
        });
        await recordModernAuditEvent({
          workspaceSubdomain: tenant,
          tableName: 'students',
          recordId: String(s.id),
          actionType: 'DELETE',
          oldState: s,
          minimizeDelta: false,
        });
      }
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('students');
  return result;
}
