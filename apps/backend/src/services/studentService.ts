import { normalizeStoredStudent } from '@mms/shared';
import {
  studentListSchema,
  type StudentRecord,
} from '../validation/studentSchemas.js';
import { defineCollectionCrudService } from './collectionCrudService.js';

const students = defineCollectionCrudService(
  'students',
  studentListSchema,
  (record) => normalizeStoredStudent(record) as StudentRecord,
);

export const loadStudents = students.load;
export const createStudent = students.create;
export const updateStudentById = students.updateById;
export const deleteStudentById = students.deleteById;
