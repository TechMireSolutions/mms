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
  type TeacherRecord,
  teacherRecordSchema,
} from '../validation/teacherSchemas.js';
import { loadContacts } from './contactService.js';
import {
  createGenericRelationalService,
  loadHydratedAll,
  loadHydratedById,
  loadHydratedByIds,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listTeachersByWorkspace,
  findTeacherById,
  findTeachersByIds,
  saveTeacher,
} from '../db/repositories/teacherRepository.js';

type TeacherRepo = GenericServiceOptions<TeacherRecord>['repo'];
const crud = createGenericRelationalService<TeacherRecord>({
  repo: {
    listByWorkspace: listTeachersByWorkspace,
    findById: findTeacherById,
    save: saveTeacher,
  } as unknown as TeacherRepo,
  schema: teacherRecordSchema,
  websocketCollection: 'teachers',
  idPrefix: 'tch',
  normalizeFn: normalizeStoredTeacher as (record: TeacherRecord) => TeacherRecord,
});

export const createTeacher = crud.create;
export const updateTeacherById = crud.updateById;
export const deleteTeacherById = crud.deleteById;
export const restoreTeacherById = crud.restoreById;

export async function loadTeachers(options?: { includeDeleted?: boolean }): Promise<TeacherRecord[]> {
  return loadHydratedAll(
    listTeachersByWorkspace,
    loadContacts,
    (row, contacts) => hydrateTeacherFromContact(row as never, contacts as never),
    options,
  ) as unknown as TeacherRecord[];
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
  return loadHydratedByIds(
    ids,
    findTeachersByIds,
    loadContacts,
    (row, contacts) => hydrateTeacherFromContact(row as never, contacts as never),
  ) as unknown as TeacherRecord[];
}

export async function loadTeacherById(id: string, includeDeleted = false) {
  return loadHydratedById(
    id,
    findTeacherById,
    loadContacts,
    (row, contacts) => hydrateTeacherFromContact(row as never, contacts as never),
    includeDeleted,
  ) as unknown as TeacherRecord | null;
}

export async function loadTeacherLinkedContactIds(excludeTeacherId?: string) {
  const all = await loadTeachers();
  return collectTeacherLinkedContactIds(all, excludeTeacherId);
}

export async function computeNextTeacherEmployeeIdForSettings(settings: TeacherEmployeeIdSettings) {
  const all = await loadTeachers();
  return computeNextTeacherEmployeeId(all, settings);
}
