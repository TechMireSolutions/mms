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
  type Teacher,
} from '@mms/shared';
import {
  type TeacherRecord,
  teacherRecordSchema,
} from '../validation/teacherSchemas.js';
import { loadContactsByIds } from './contactService.js';
import {
  createGenericRelationalService,
  createContactHydratedService,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listTeachersByWorkspace,
  findTeacherById,
  findTeachersByIds,
  saveTeacher,
} from '../db/repositories/teacherRepository.js';
import { getRequestTenant } from '../lib/tenantContext.js';

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
export const bulkSoftDeleteTeachers = crud.bulkDeleteByIds;
export const bulkRestoreTeachers = crud.bulkRestoreByIds;

export async function bulkUpdateTeacherStatus(
  ids: string[],
  status: 'active' | 'inactive' | 'on_leave',
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const outcomes = await Promise.all(
    ids.map(async (id) => {
      const existing = await findTeacherById(tenant, id);
      if (!existing || existing.deletedAt) return false;
      const updated = await updateTeacherById(id, {
        ...(existing as TeacherRecord),
        status,
        id,
      });
      return Boolean(updated);
    }),
  );

  const succeeded = outcomes.filter(Boolean).length;
  return { succeeded, failed: ids.length - succeeded };
}

const hydrated = createContactHydratedService<Teacher, TeacherRecord>({
  listByWorkspaceFn: listTeachersByWorkspace,
  findByIdFn: findTeacherById,
  findByIdsFn: findTeachersByIds,
  collectContactIdsFn: (row) => [row.contactId],
  loadContactsByIdsFn: loadContactsByIds,
  hydrateFn: (row, contacts) => hydrateTeacherFromContact(row as never, contacts as never) as unknown as TeacherRecord,
});

export const loadTeachers = hydrated.loadAll;
export const loadTeacherById = hydrated.loadById;
export const loadTeachersByIds = hydrated.loadByIds;

export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
): Promise<Record<string, import('@mms/shared').TeachersWidgetAggregateResult>> {
  const rows = await loadTeachers();
  return computeTeachersWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadTeachersPage(query: TeachersListQuery & { includeDeleted?: boolean }) {
  const rows = await loadTeachers({ includeDeleted: query.includeDeleted });
  // Trash directory (`includeDeleted`) lists archived rows only — matches FE showDeleted.
  const scoped = query.includeDeleted
    ? (rows as import('@mms/shared').Teacher[]).filter((row) => Boolean(row.deletedAt))
    : (rows as import('@mms/shared').Teacher[]);
  return paginateTeachers(scoped, query);
}



export async function loadTeacherLinkedContactIds(excludeTeacherId?: string) {
  const all = await loadTeachers();
  return collectTeacherLinkedContactIds(all, excludeTeacherId);
}

export async function computeNextTeacherEmployeeIdForSettings(settings: TeacherEmployeeIdSettings) {
  const all = await loadTeachers();
  return computeNextTeacherEmployeeId(all, settings);
}
