import {
  listEnrollmentsByWorkspace,
  findEnrollmentById,
  saveEnrollment,
} from '../db/repositories/enrollmentRepository.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { enrollmentRecordSchema } from '../validation/enrollmentSchemas.js';
import type { EnrollmentRecord } from '../validation/enrollmentSchemas.js';
import { paginateEnrollments, type EnrollmentsListQuery, type Enrollment } from '@mms/shared';

const crud = createGenericRelationalService<EnrollmentRecord>({
  repo: {
    listByWorkspace: listEnrollmentsByWorkspace,
    findById: findEnrollmentById,
    save: saveEnrollment,
  },
  schema: enrollmentRecordSchema,
  websocketCollection: 'enrollments',
  idPrefix: 'enr',
});

export const loadEnrollments = crud.loadAll;
export const createEnrollment = crud.create;
export const updateEnrollmentById = crud.updateById;
export const deleteEnrollmentById = crud.deleteById;
export const restoreEnrollmentById = crud.restoreById;
export const bulkSoftDeleteEnrollments = crud.bulkDeleteByIds;
export const bulkRestoreEnrollments = crud.bulkRestoreByIds;

export async function loadEnrollmentsPage(query: EnrollmentsListQuery & { includeDeleted?: boolean }) {
  const rows = await loadEnrollments({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted
    ? (rows as Enrollment[]).filter((row) => Boolean(row.deletedAt))
    : (rows as Enrollment[]);
  return paginateEnrollments(scoped, query);
}
