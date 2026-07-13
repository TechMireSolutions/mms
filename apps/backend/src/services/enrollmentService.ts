import {
  listEnrollmentsByWorkspace,
  findEnrollmentById,
  saveEnrollment,
} from '../db/repositories/enrollmentRepository.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { enrollmentRecordSchema } from '../validation/enrollmentSchemas.js';
import type { EnrollmentRecord } from '../validation/enrollmentSchemas.js';

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
