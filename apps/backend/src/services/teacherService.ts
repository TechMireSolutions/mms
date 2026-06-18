import { normalizeStoredTeacher } from '@mms/shared';
import {
  teacherListSchema,
  type TeacherRecord,
} from '../validation/teacherSchemas.js';
import { defineCollectionCrudService } from './collectionCrudService.js';

const teachers = defineCollectionCrudService(
  'teachers',
  teacherListSchema,
  (record) => normalizeStoredTeacher(record) as TeacherRecord,
);

export const loadTeachers = teachers.load;
export const createTeacher = teachers.create;
export const updateTeacherById = teachers.updateById;
export const deleteTeacherById = teachers.deleteById;
