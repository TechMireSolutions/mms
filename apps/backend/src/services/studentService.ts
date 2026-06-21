import { normalizeStoredStudent, computeStudentsWidgetAggregates, paginateStudents, computeNextGrNumber, findStudentRegistrationConflict, collectStudentLinkedContactIds, type StudentGrNumberSettings, type StudentDuplicateCheckInput, type StudentsListQuery, type StudentsWidgetQuery } from '@mms/shared';
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

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').StudentsWidgetAggregateResult>> {
  const rows = await loadStudents();
  return computeStudentsWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadStudentsPage(query: StudentsListQuery) {
  const rows = await loadStudents();
  return paginateStudents(rows as import('@mms/shared').Student[], query);
}

export async function loadStudentsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadStudents();
  return all.filter((row) => wanted.has(String(row.id)));
}

export async function loadStudentById(id: string) {
  const all = await loadStudents();
  return all.find((row) => String(row.id) === String(id)) ?? null;
}

export async function loadStudentLinkedContactIds(excludeStudentId?: string) {
  const all = await loadStudents();
  return collectStudentLinkedContactIds(all, excludeStudentId);
}

export async function computeNextGrNumberForDate(regDate: string, settings: StudentGrNumberSettings) {
  const all = await loadStudents();
  return computeNextGrNumber(all, settings, regDate);
}

export async function checkStudentRegistrationDuplicate(input: StudentDuplicateCheckInput) {
  const all = await loadStudents();
  return { reason: findStudentRegistrationConflict(all, input) };
}
