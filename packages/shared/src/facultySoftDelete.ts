import {
  CLIENT_SOFT_DELETE_KEYS,
  stripClientSoftDeleteFields,
} from './contactSoftDelete.js';

/** Client-supplied soft-delete keys for teacher/faculty mutations. */
export const TEACHER_CLIENT_SOFT_DELETE_KEYS = CLIENT_SOFT_DELETE_KEYS;
export const FACULTY_CLIENT_SOFT_DELETE_KEYS = TEACHER_CLIENT_SOFT_DELETE_KEYS;

/** Strip client soft-delete metadata from teacher/faculty create/update payloads. */
export function stripTeacherClientSoftDeleteFields<T>(record: T): T {
  const next = stripClientSoftDeleteFields(record);
  if (next && typeof next === 'object') {
    delete (next as Record<string, unknown>).deleted;
  }
  return next;
}

export const stripFacultyClientSoftDeleteFields = stripTeacherClientSoftDeleteFields;

export {
  stripClientSoftDeleteFields,
} from './contactSoftDelete.js';

export {
  isEntityDeleted,
  filterActiveEntities,
} from './softDelete.js';

export {
  filterActiveTeachers,
  isTeacherDeleted,
  filterActiveFaculty,
  isFacultyDeleted,
} from './facultyTypes.js';


