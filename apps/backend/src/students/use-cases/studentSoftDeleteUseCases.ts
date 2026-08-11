import type { Student } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../services/websocketService.js';
import type { StudentsRepository } from '../repository/studentsRepository.js';
import { studentsRepository } from '../repository/studentsRepositoryAdapter.js';
import { StudentRestoreConflictError } from './studentNormalizeUseCases.js';

interface StudentBulkRestoreConflict {
  id: string;
  errors: Array<{ field: string; message: string }>;
}

interface StudentBulkRestoreResult {
  succeeded: number;
  failed: number;
  conflicts: StudentBulkRestoreConflict[];
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Clears soft-delete metadata on a stored student row (restore). */
function restoredRow(existing: Student): Student {
  return {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    updatedAt: nowIso(),
  };
}

export async function restoreStudentById(
  id: string,
  _restoredBy: string,
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

    const next = restoredRow(existing);
    await repo.save(tenant, next);
    return next;
  });
  if (restored) await broadcastCollection('students');
  return restored;
}

export async function bulkRestoreStudents(
  ids: string[],
  _restoredBy: string,
  repo: StudentsRepository = studentsRepository,
): Promise<StudentBulkRestoreResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return { succeeded: 0, failed: ids.length, conflicts: [] };
    let succeeded = 0;
    let failed = 0;
    const conflicts: StudentBulkRestoreConflict[] = [];
    const toSave: Student[] = [];
    const restoredIds = new Set<string>();

    const existingStudents = await repo.findByIds(tenant, ids);
    const existingMap = new Map(existingStudents.map((student) => [String(student.id), student]));

    for (const id of ids) {
      const existing = existingMap.get(String(id));
      if (!existing || !existing.deletedAt) {
        failed += 1;
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
      toSave.push(restoredRow(existing));
      restoredIds.add(String(id));
      succeeded += 1;
    }

    if (toSave.length > 0) {
      await repo.bulkSave(tenant, toSave);
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
    }
    return { succeeded, failed };
  });
  if (result.succeeded > 0) await broadcastCollection('students');
  return result;
}
