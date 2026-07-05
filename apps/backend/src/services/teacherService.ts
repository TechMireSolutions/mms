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
import { persistCollection } from './dbSyncService.js';

const teachers = defineCollectionCrudService(
  'teachers',
  teacherListSchema,
  (record) => normalizeStoredTeacher(record) as TeacherRecord,
);

export async function loadTeachers(options?: { includeDeleted?: boolean }): Promise<TeacherRecord[]> {
  const rawRows = await teachers.load();
  const filtered = options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return filtered;
  }
  return filtered.map((row) =>
    hydrateTeacherFromContact(row as never, contactsData as never)
  ) as unknown as TeacherRecord[];
}

export const createTeacher = teachers.create;
export const updateTeacherById = teachers.updateById;

export async function deleteTeacherById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const all = await teachers.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || all[index].deletedAt) return false;
  all[index] = {
    ...all[index],
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  };
  await persistCollection('teachers', all);
  return true;
}

export async function restoreTeacherById(id: string): Promise<boolean> {
  const all = await teachers.load();
  const index = all.findIndex((row) => String(row.id) === id);
  if (index < 0 || !all[index].deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = all[index];
  all[index] = rest as TeacherRecord;
  await persistCollection('teachers', all);
  return true;
}

export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
): Promise<Record<string, import('@mms/shared').TeachersWidgetAggregateResult>> {
  const rows = await loadTeachers();
  return computeTeachersWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadTeachersPage(query: TeachersListQuery & { includeDeleted?: boolean }) {
  const rows = await loadTeachers({ includeDeleted: query.includeDeleted });
  return paginateTeachers(rows as import('@mms/shared').Teacher[], query);
}

export async function loadTeachersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadTeachers({ includeDeleted: true });
  return all.filter((row) => wanted.has(String(row.id)));
}

export async function loadTeacherById(id: string, includeDeleted = false) {
  const all = await loadTeachers({ includeDeleted });
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
