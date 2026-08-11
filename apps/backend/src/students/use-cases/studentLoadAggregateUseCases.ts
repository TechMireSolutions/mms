import type {
  StudentsCommandMetricsSnapshot,
  StudentsWidgetAggregateResult,
  StudentsWidgetQuery,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import type { StudentsRepository } from '../repository/studentsRepository.js';
import { studentsRepository } from '../repository/studentsRepositoryAdapter.js';

export async function loadStudentsCommandMetrics(
  repo: StudentsRepository = studentsRepository,
): Promise<StudentsCommandMetricsSnapshot> {
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
  return repo.aggregateCommandMetrics(tenant);
}

export async function loadStudentFieldUsageCounts(
  fieldKeys: string[],
  repo: StudentsRepository = studentsRepository,
): Promise<Record<string, number>> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }
  return repo.countFieldUsageByKeys(tenant, fieldKeys);
}

export async function loadStudentFieldUsageCount(
  fieldKey: string,
  repo: StudentsRepository = studentsRepository,
): Promise<number> {
  const counts = await loadStudentFieldUsageCounts([fieldKey], repo);
  return counts[fieldKey] ?? 0;
}

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
  repo: StudentsRepository = studentsRepository,
): Promise<Record<string, StudentsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return repo.aggregateWidgetQueries(tenant, queries);
}
