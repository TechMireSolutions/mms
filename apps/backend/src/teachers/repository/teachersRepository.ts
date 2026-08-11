import type {
  Teacher,
  TeacherDuplicateCheckInput,
  TeacherDuplicateReason,
  TeacherRecord,
  TeachersCommandMetricsSnapshot,
  TeachersListPageResult,
  TeachersListQuery,
  TeachersWidgetAggregateResult,
  TeachersWidgetQuery,
} from '@mms/shared';

/**
 * Sole gateway to teacher storage.
 *
 * Use cases depend on this interface — never on concrete Drizzle functions —
 * so persistence can be swapped (tests, future data source) without touching
 * domain orchestration. The Drizzle implementation lives in
 * `teachersRepositoryAdapter.ts` and reuses the existing tenant-scoped
 * `db/repositories/teacherRepository*` functions.
 */
export interface TeachersRepository {
  countByWorkspace(
    tenant: string,
    options?: { includeDeleted?: boolean },
  ): Promise<number>;
  listPage(tenant: string, query: TeachersListQuery): Promise<TeachersListPageResult>;
  findById(tenant: string, id: string): Promise<Teacher | null>;
  findByIds(tenant: string, ids: string[]): Promise<Teacher[]>;
  /** Soft-delete probe for restore-on-create re-registration (Contact SSOT). */
  findSoftDeletedByContactId(tenant: string, contactId: string): Promise<Teacher | null>;
  save(tenant: string, teacher: Teacher | TeacherRecord): Promise<void>;
  bulkSave(tenant: string, teachers: Array<Teacher | TeacherRecord>): Promise<void>;

  countFieldUsageByKeys(tenant: string, fieldKeys: string[]): Promise<Record<string, number>>;
  aggregateCommandMetrics(
    tenant: string,
    periodDays?: number,
  ): Promise<TeachersCommandMetricsSnapshot>;
  aggregateWidgetQueries(
    tenant: string,
    queries: TeachersWidgetQuery[],
  ): Promise<Record<string, TeachersWidgetAggregateResult>>;
  listLinkedContactIds(tenant: string, excludeTeacherId?: string): Promise<Array<string | number>>;

  countNextEmployeeId(tenant: string): Promise<number>;
  /** Active rows missing an employee id (backfill candidates) — Students GR-migration parity. */
  listActiveMissingEmployeeId(tenant: string): Promise<Teacher[]>;
  /** Active duplicate probe (contact / employeeId) before save — server authoritative. */
  findRegistrationConflict(
    tenant: string,
    input: TeacherDuplicateCheckInput,
  ): Promise<TeacherDuplicateReason | null>;
  bulkUpdateStatusSql(tenant: string, ids: string[], status: string): Promise<number>;
}
