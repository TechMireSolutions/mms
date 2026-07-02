import {
  normalizeStoredTeacher,
  paginateTeachers,
  computeTeachersWidgetAggregates,
  computeNextTeacherEmployeeId,
  collectTeacherLinkedContactIds,
  hydrateTeacherFromContact,
  type TeacherEmployeeIdSettings,
  type TeachersListQuery,
  type TeachersWidgetQuery,
} from '@mms/shared';
import {
  teacherListSchema,
  type TeacherRecord,
} from '../validation/teacherSchemas.js';
import { loadContacts } from './contactService.js';
import { defineCollectionCrudService } from './collectionCrudService.js';

const teachers = defineCollectionCrudService(
  'teachers',
  teacherListSchema,
  (record) => normalizeStoredTeacher(record) as TeacherRecord,
);

export async function loadTeachers(): Promise<TeacherRecord[]> {
  const rawRows = await teachers.load();
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return rawRows;
  }
  return rawRows.map((row) =>
    hydrateTeacherFromContact(row as never, contactsData as never)
  ) as unknown as TeacherRecord[];
}

export const createTeacher = teachers.create;
export const updateTeacherById = teachers.updateById;
export const deleteTeacherById = teachers.deleteById;

export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
): Promise<Record<string, import('@mms/shared').TeachersWidgetAggregateResult>> {
  const rows = await loadTeachers();
  return computeTeachersWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadTeachersPage(query: TeachersListQuery) {
  const rows = await loadTeachers();
  return paginateTeachers(rows as import('@mms/shared').Teacher[], query);
}

export async function loadTeachersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadTeachers();
  return all.filter((row) => wanted.has(String(row.id)));
}

export async function loadTeacherById(id: string) {
  const all = await loadTeachers();
  return all.find((row) => String(row.id) === String(id)) ?? null;
}

export async function loadTeacherLinkedContactIds(excludeTeacherId?: string) {
  const all = await loadTeachers();
  return collectTeacherLinkedContactIds(all, excludeTeacherId);
}

export async function computeNextTeacherEmployeeIdForSettings(settings: TeacherEmployeeIdSettings) {
  const all = await loadTeachers();
  return computeNextTeacherEmployeeId(all, settings);
}
