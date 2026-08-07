import {
  type StudentsListQuery,
  type StudentsWidgetQuery,
  type Student,
} from '@mms/shared';
import {
  listStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
} from '../db/repositories/studentRepository.js';
import {
  listStudentsPage,
  countStudentsActive,
  aggregateStudentsCommandMetrics,
} from '../db/repositories/studentRepositoryList.js';
import {
  aggregateStudentsWidgetQueries,
  listStudentLinkedContactIdsSql,
} from '../db/repositories/studentRepositoryWidgets.js';
import { countStudentFieldUsageByKeys } from '../db/repositories/studentRepositoryFieldUsage.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { hydrateStudentsFromContacts } from './studentServiceHydrate.js';

export async function loadStudents(options?: { includeDeleted?: boolean }): Promise<Student[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const raw = await listStudentsByWorkspace(tenant, {
    deleted: options?.includeDeleted ? 'deleted' : 'active',
  });
  return hydrateStudentsFromContacts(raw as Student[]);
}

export async function loadStudentById(id: string): Promise<Student | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const row = await findStudentById(tenant, id);
  if (!row) return null;
  const [hydrated] = await hydrateStudentsFromContacts([row as Student]);
  return hydrated ?? null;
}

export async function loadStudentsByIds(ids: string[]): Promise<Student[]> {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  const raw = await findStudentsByIds(tenant, ids);
  return hydrateStudentsFromContacts(raw as Student[]);
}

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').StudentsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateStudentsWidgetQueries(tenant, queries);
}

export async function loadStudentsPage(query: StudentsListQuery) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { students: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }
  const page = await listStudentsPage(tenant, query);
  return {
    ...page,
    students: await hydrateStudentsFromContacts(page.students),
  };
}

export async function countStudents(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countStudentsActive(tenant);
}

export async function loadStudentsCommandMetrics() {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      newThisPeriod: 0,
    };
  }
  return aggregateStudentsCommandMetrics(tenant);
}

export async function loadStudentLinkedContactIds(excludeStudentId?: string) {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listStudentLinkedContactIdsSql(tenant, excludeStudentId);
}

export async function loadStudentFieldUsageCounts(
  fieldKeys: string[],
): Promise<Record<string, number>> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }
  return countStudentFieldUsageByKeys(tenant, fieldKeys);
}

export async function loadStudentFieldUsageCount(fieldKey: string): Promise<number> {
  const counts = await loadStudentFieldUsageCounts([fieldKey]);
  return counts[fieldKey] ?? 0;
}
