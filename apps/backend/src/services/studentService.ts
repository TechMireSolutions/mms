import {
  normalizeStoredStudent,
  computeStudentsWidgetAggregates,
  paginateStudents,
  computeNextGrNumber,
  findStudentRegistrationConflict,
  collectStudentLinkedContactIds,
  hydrateStudentFromContacts,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
  type StudentsListQuery,
  type StudentsWidgetQuery,
} from '@mms/shared';
import {
  studentListSchema,
  type StudentRecord,
} from '../validation/studentSchemas.js';
import { loadContacts } from './contactService.js';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const students = defineCollectionCrudService(
  'students',
  studentListSchema,
  (record) => normalizeStoredStudent(record) as StudentRecord,
);

export async function loadStudents(options?: { includeDeleted?: boolean }): Promise<StudentRecord[]> {
  const rawRows = await students.load();
  const filtered = options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return filtered;
  }
  return filtered.map((row) =>
    hydrateStudentFromContacts(row as never, contactsData as never)
  ) as unknown as StudentRecord[];
}

export const createStudent = students.create;
export const updateStudentById = students.updateById;

export async function deleteStudentById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const all = await students.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || all[index].deletedAt) return false;
  all[index] = {
    ...all[index],
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  };
  await persistCollection('students', all);
  return true;
}

export async function restoreStudentById(id: string): Promise<boolean> {
  const all = await students.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || !all[index].deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = all[index];
  all[index] = rest as StudentRecord;
  await persistCollection('students', all);
  return true;
}

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').StudentsWidgetAggregateResult>> {
  const rows = await loadStudents();
  return computeStudentsWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadStudentsPage(query: StudentsListQuery & { includeDeleted?: boolean }) {
  const rows = await loadStudents({ includeDeleted: query.includeDeleted });
  return paginateStudents(rows as import('@mms/shared').Student[], query);
}

export async function loadStudentsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadStudents({ includeDeleted: true });
  return all.filter((row) => wanted.has(String(row.id)));
}

export async function loadStudentById(id: string, includeDeleted = false) {
  const all = await loadStudents({ includeDeleted });
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
