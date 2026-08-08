import {
  computeNextTeacherEmployeeIdFromCount,
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
import {
  listTeachersPage,
  countTeachersActive,
  countTeachersForNextEmployeeId,
  listTeacherLinkedContactIdsSql,
  aggregateTeachersCommandMetrics,
  bulkUpdateTeachersStatusSql,
} from '../db/repositories/teacherRepositoryList.js';
import { aggregateTeachersWidgetQueries } from '../db/repositories/teacherRepositoryWidgets.js';
import { countTeacherFieldUsageByKeys } from '../db/repositories/teacherRepositoryFieldUsage.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

type TeacherRepo = GenericServiceOptions<TeacherRecord>['repo'];
/** Profile strip SSOT is `teacherRecordSchema` transform (`normalizeStoredTeacher`) — no second normalizeFn. */
const crud = createGenericRelationalService<TeacherRecord>({
  repo: {
    listByWorkspace: listTeachersByWorkspace,
    findById: findTeacherById,
    save: saveTeacher,
  } as unknown as TeacherRepo,
  schema: teacherRecordSchema,
  websocketCollection: 'teachers',
  idPrefix: 'tch',
});

export const createTeacher = crud.create;
export const updateTeacherById = crud.updateById;
export const deleteTeacherById = crud.deleteById;
export const restoreTeacherById = crud.restoreById;
export const bulkSoftDeleteTeachers = crud.bulkDeleteByIds;
export const bulkRestoreTeachers = crud.bulkRestoreByIds;

export async function bulkUpdateTeacherStatus(
  ids: string[],
  status: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await bulkUpdateTeachersStatusSql(tenant, uniqueIds, status);
  if (succeeded > 0) {
    await broadcastCollection('teachers');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}

const hydrated = createContactHydratedService<Teacher, TeacherRecord>({
  listByWorkspaceFn: listTeachersByWorkspace,
  findByIdFn: findTeacherById,
  findByIdsFn: findTeachersByIds,
  collectContactIdsFn: (row) => [row.contactId],
  loadContactsByIdsFn: loadContactsByIds,
  hydrateFn: (row, contacts) => hydrateTeacherFromContact(row as never, contacts as never) as unknown as TeacherRecord,
});

export const loadTeacherById = hydrated.loadById;
export const loadTeachersByIds = hydrated.loadByIds;

export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
): Promise<Record<string, import('@mms/shared').TeachersWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateTeachersWidgetQueries(tenant, queries);
}

export async function loadTeachersPage(query: TeachersListQuery & { includeDeleted?: boolean }) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { teachers: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }
  const page = await listTeachersPage(tenant, query);
  const ids = page.teachers.map((row) => String(row.id));
  const hydrated = ids.length > 0 ? await loadTeachersByIds(ids) : [];
  const byId = new Map(hydrated.map((row) => [String(row.id), row]));
  return {
    ...page,
    teachers: ids.map((id) => byId.get(id)).filter(Boolean) as Teacher[],
  };
}

export async function countTeachers(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countTeachersActive(tenant);
}

export async function loadTeachersCommandMetrics() {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      onLeave: 0,
      other: 0,
      newThisPeriod: 0,
    };
  }
  return aggregateTeachersCommandMetrics(tenant);
}



export async function loadTeacherLinkedContactIds(excludeTeacherId?: string) {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listTeacherLinkedContactIdsSql(tenant, excludeTeacherId);
}

export async function computeNextTeacherEmployeeIdForSettings(settings: TeacherEmployeeIdSettings) {
  const tenant = getRequestTenant();
  const count = tenant ? await countTeachersForNextEmployeeId(tenant) : 0;
  return computeNextTeacherEmployeeIdFromCount(count, settings);
}

export async function loadTeacherFieldUsageCounts(
  fieldKeys: string[],
): Promise<Record<string, number>> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }
  return countTeacherFieldUsageByKeys(tenant, fieldKeys);
}

export async function loadTeacherFieldUsageCount(fieldKey: string): Promise<number> {
  const counts = await loadTeacherFieldUsageCounts([fieldKey]);
  return counts[fieldKey] ?? 0;
}
