import type {
  TeachersCommandMetricsSnapshot,
  TeachersWidgetAggregateResult,
  TeachersWidgetQuery,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import type { TeachersRepository } from '../repository/teachersRepository.js';
import { teachersRepository } from '../repository/teachersRepositoryAdapter.js';

export async function loadTeachersCommandMetrics(
  repo: TeachersRepository = teachersRepository,
): Promise<TeachersCommandMetricsSnapshot> {
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
  return repo.aggregateCommandMetrics(tenant);
}



export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
  repo: TeachersRepository = teachersRepository,
): Promise<Record<string, TeachersWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return repo.aggregateWidgetQueries(tenant, queries);
}
