import type {
  Student,
  StudentRecord,
  StudentsCommandMetricsSnapshot,
  StudentsListPageResult,
  StudentsListQuery,
  StudentsWidgetAggregateResult,
  StudentsWidgetQuery,
} from '@mms/shared';

/** Soft-delete visibility filter shared by list/count repository reads. */
type StudentDeletedFilter = 'active' | 'deleted' | 'all';

interface ListStudentsOptions {
  deleted?: StudentDeletedFilter;
}

/** GR sequence count + conflict probe inputs mirror the typed Drizzle queries. */
interface StudentGrSequenceInput {
  regDate: string;
  restartAnnually: boolean;
}

interface StudentRegistrationConflictInput {
  excludeId?: string;
  contactId?: string | number;
  email?: string;
  name?: string;
  dob?: string;
  grNumber?: string;
}

type StudentRegistrationConflictReason =
  | 'contact'
  | 'email'
  | 'nameDob'
  | 'grNumber'
  | null;

/**
 * Sole gateway to student storage.
 *
 * Use cases depend on this interface — never on concrete Drizzle functions —
 * so persistence can be swapped (tests, future data source) without touching
 * domain orchestration. The Drizzle implementation lives in
 * `studentsRepositoryAdapter.ts` and reuses the existing tenant-scoped
 * `db/repositories/studentRepository*` functions.
 */
export interface StudentsRepository {
  countByWorkspace(tenant: string, options?: ListStudentsOptions): Promise<number>;
  listPage(tenant: string, query: StudentsListQuery): Promise<StudentsListPageResult>;
  findById(tenant: string, id: string): Promise<Student | null>;
  findByIds(tenant: string, ids: string[]): Promise<Student[]>;
  save(tenant: string, student: Student | StudentRecord): Promise<void>;
  bulkSave(tenant: string, students: Array<Student | StudentRecord>): Promise<void>;

  countFieldUsageByKeys(tenant: string, fieldKeys: string[]): Promise<Record<string, number>>;
  aggregateCommandMetrics(
    tenant: string,
    periodDays?: number,
  ): Promise<StudentsCommandMetricsSnapshot>;
  aggregateWidgetQueries(
    tenant: string,
    queries: StudentsWidgetQuery[],
  ): Promise<Record<string, StudentsWidgetAggregateResult>>;
  listLinkedContactIds(tenant: string, excludeStudentId?: string): Promise<Array<string | number>>;

  countNextGrNumber(
    tenant: string,
    input: StudentGrSequenceInput,
  ): Promise<number>;
  findRegistrationConflict(
    tenant: string,
    input: StudentRegistrationConflictInput,
  ): Promise<StudentRegistrationConflictReason>;
  /** Soft-deleted student sharing `contactId` (restore-on-create probe). */
  findSoftDeletedByContactId(tenant: string, contactId: string): Promise<Student | null>;
  listActiveMissingGrNumber(tenant: string): Promise<Student[]>;
  bulkUpdateStatusSql(tenant: string, ids: string[], status: string): Promise<number>;
}
