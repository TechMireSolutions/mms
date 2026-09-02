import type { ActivityLog, UsersListQuery, UsersCommandMetricsSnapshot } from '@mms/shared';
import type { TenantUserRow } from '../../db/repositories/tenantUserRepository.js';

/**
 * Sole storage gateway for the users module (tenant users + activity logs).
 *
 * Mirrors the `contacts`/`sessions`/`enrollments`/`finance`/`attendance`/`hasanat`/
 * `questionBank`/`examinations`/`obligations`/`accounting`/`messaging` reference
 * pattern: routes and use-cases depend on this interface (never on Drizzle
 * directly), and the Drizzle-backed adapter is the only implementation. Tests
 * can inject a fake repository at the seam.
 */
export interface UsersRepository {
  // Tenant users
  listTenantUsersPage(
    tenant: string,
    query: UsersListQuery & { includeDeleted?: boolean },
  ): Promise<{ rows: TenantUserRow[]; total: number; page: number; limit: number; hasMore: boolean }>;
  countTenantUsersActive(tenant: string): Promise<number>;
  aggregateUsersCommandMetrics(
    tenant: string,
    periodDays?: number,
  ): Promise<UsersCommandMetricsSnapshot>;
  listTenantUsersByIds(ids: string[]): Promise<TenantUserRow[]>;
  findTenantUserRowById(id: string): Promise<TenantUserRow | null>;
  softDeleteTenantUserRow(id: string, deletedBy: string): Promise<boolean>;
  restoreTenantUserRow(id: string): Promise<boolean>;
  verifyTenantUserEmailRow(id: string): Promise<boolean>;
  resetTenantUserPasswordRow(id: string, passwordHash: string): Promise<boolean>;

  // Activity logs
  listActivityLogsByWorkspace(tenant: string): Promise<ActivityLog[]>;
  bulkSaveActivityLogs(tenant: string, records: ActivityLog[]): Promise<void>;
  replaceActivityLogsForWorkspace(tenant: string, records: ActivityLog[]): Promise<void>;
}
