import type { StudentRecord, User } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../services/websocketService.js';
import { canDeleteCollection } from '../../services/rbacService.js';
import type { StudentsRepository } from '../repository/studentsRepository.js';
import { studentsRepository } from '../repository/studentsRepositoryAdapter.js';
import {
  prepareStudentRecord,
  throwGrUniqueConflict,
  StudentPermissionError,
  StudentRestoreConflictError,
} from './studentNormalizeUseCases.js';

export interface CreateStudentResult {
  record: StudentRecord;
  /** True when an archived student with the same contactId was restored instead of inserting. */
  restored: boolean;
}

interface CreateStudentOptions {
  user?: User;
}

/**
 * Creates a student. When the incoming record carries a `contactId` that matches a
 * soft-deleted student (re-registration), the archived row is restored in place —
 * its id/createdAt are preserved, deletion markers cleared, and incoming fields
 * overlaid (Contacts restore-on-create parity). Restoring requires delete
 * permission (Contacts parity).
 */
export async function createStudent(
  record: StudentRecord,
  options: CreateStudentOptions | User = {},
  repo: StudentsRepository = studentsRepository,
): Promise<CreateStudentResult> {
  const result = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const normalized = prepareStudentRecord(record);
    const contactId = normalized.contactId != null ? String(normalized.contactId).trim() : '';

    if (contactId) {
      const archived = await repo.findSoftDeletedByContactId(tenant, contactId);
      if (archived) {
        const user = options && 'role' in options ? (options as User) : (options as CreateStudentOptions)?.user;
        if (user && !canDeleteCollection(user, 'students')) {
          throw new StudentPermissionError('Restoring soft-deleted students requires delete permissions');
        }
        const merged = prepareStudentRecord({
          ...archived,
          ...normalized,
          id: archived.id,
        });
        const conflict = await repo.findRegistrationConflict(tenant, {
          grNumber: merged.grNumber as string | undefined,
          excludeId: String(archived.id),
        });
        if (conflict === 'grNumber') {
          throw new StudentRestoreConflictError();
        }
        await repo.save(tenant, merged);
        return { record: merged, restored: true };
      }
    }

    try {
      await repo.save(tenant, normalized);
    } catch (error: unknown) {
      throwGrUniqueConflict(error);
    }
    return { record: normalized, restored: false };
  });
  await broadcastCollection('students');
  return result;
}

export async function updateStudentById(
  id: string,
  record: StudentRecord,
  repo: StudentsRepository = studentsRepository,
): Promise<StudentRecord | null> {
  const saved = await runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return null;
    const normalized = prepareStudentRecord({ ...record, id });
    try {
      await repo.save(tenant, normalized);
    } catch (error: unknown) {
      throwGrUniqueConflict(error);
    }
    return normalized;
  });
  if (saved) await broadcastCollection('students');
  return saved;
}
