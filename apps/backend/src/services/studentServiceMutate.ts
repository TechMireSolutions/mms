import {
  normalizeStoredStudent,
  type StudentRecord,
  studentRecordSchema,
} from '@mms/shared';
import {
  createGenericRelationalService,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listStudentsByWorkspace,
  findStudentById,
  saveStudent,
} from '../db/repositories/studentRepository.js';
import { bulkUpdateStudentsStatusSql } from '../db/repositories/studentRepositoryList.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

type StudentRepo = GenericServiceOptions<StudentRecord>['repo'];
const crud = createGenericRelationalService<StudentRecord>({
  repo: {
    listByWorkspace: listStudentsByWorkspace,
    findById: findStudentById,
    save: saveStudent,
  } as unknown as StudentRepo,
  schema: studentRecordSchema,
  websocketCollection: 'students',
  idPrefix: 'st',
  normalizeFn: normalizeStoredStudent as (record: StudentRecord) => StudentRecord,
});

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (code === '23505') return true;
  const cause = 'cause' in error ? (error as { cause?: unknown }).cause : undefined;
  return isUniqueViolation(cause);
}

export function throwGrUniqueConflict(error: unknown): never {
  if (isUniqueViolation(error)) {
    const conflict = new Error('A student with this GR number already exists.') as Error & {
      statusCode: number;
      type: string;
    };
    conflict.statusCode = 409;
    conflict.type = 'conflict';
    throw conflict;
  }
  throw error;
}

export const createStudent = async (record: StudentRecord): Promise<StudentRecord> => {
  try {
    return await crud.create(record);
  } catch (error: unknown) {
    throwGrUniqueConflict(error);
  }
};

export const updateStudentById = async (
  id: string,
  record: StudentRecord,
): Promise<StudentRecord | null> => {
  try {
    return await crud.updateById(id, record);
  } catch (error: unknown) {
    throwGrUniqueConflict(error);
  }
};

export const deleteStudentById = crud.deleteById;
export const restoreStudentById = crud.restoreById;
export const bulkSoftDeleteStudents = crud.bulkDeleteByIds;
export const bulkRestoreStudents = crud.bulkRestoreByIds;

export async function bulkUpdateStudentStatus(
  ids: string[],
  status: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await bulkUpdateStudentsStatusSql(tenant, uniqueIds, status);
  if (succeeded > 0) {
    await broadcastCollection('students');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}
