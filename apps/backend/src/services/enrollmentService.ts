import {
  type Enrollment,
  enrollmentListSchema,
  enrollmentRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';

const ENROLLMENTS_COLLECTION = 'enrollments';

const normalizeEnrollment = (record: Enrollment) => enrollmentRecordSchema.parse(record);
const enrollmentCrud = defineCollectionCrudService(ENROLLMENTS_COLLECTION, enrollmentListSchema, normalizeEnrollment);

export const loadEnrollments = enrollmentCrud.load;
export const createEnrollment = enrollmentCrud.create;
export const updateEnrollmentById = enrollmentCrud.updateById;
export const deleteEnrollmentById = enrollmentCrud.deleteById;
