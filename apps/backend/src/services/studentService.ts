import {
  normalizeStoredStudent,
  computeNextGrNumber,
  backfillMissingStudentGrNumbers,
  hydrateStudentFromContacts,
  normalizeStudentsSettings,
  todayISO,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
  type StudentsListQuery,
  type StudentsWidgetQuery,
  type Student,
  type StudentRecord,
  studentRecordSchema,
} from '@mms/shared';
import { loadContactsByIds } from './contactService.js';
import { fetchObject } from './dbSyncService.js';
import {
  createGenericRelationalService,
  createContactHydratedService,
  hydrateRecordsFromContacts,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
  saveStudent,
  bulkSaveStudents,
} from '../db/repositories/studentRepository.js';
import {
  listStudentsPage,
  countStudentsActive,
  aggregateStudentsCommandMetrics,
} from '../db/repositories/studentRepositoryList.js';
import {
  aggregateStudentsWidgetQueries,
  listStudentLinkedContactIdsSql,
  countStudentsForNextGrNumber,
  findStudentRegistrationConflictSql,
} from '../db/repositories/studentRepositoryWidgets.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastTenantUpdate } from './websocketService.js';

const STUDENTS_SETTINGS_KEY = 'students_settings';

type StudentRepo = GenericServiceOptions<StudentRecord>['repo'];
const crud = createGenericRelationalService<StudentRecord>({
  repo: {
    listByWorkspace: listStudentsByWorkspace,
    findById: findStudentById,
    save: saveStudent,
  } as unknown as StudentRepo,
  schema: studentRecordSchema,
  websocketCollection: 'students',
  idPrefix: 'st',
  normalizeFn: normalizeStoredStudent as (record: StudentRecord) => StudentRecord,
});

export const createStudent = crud.create;
export const updateStudentById = crud.updateById;
export const deleteStudentById = crud.deleteById;
export const restoreStudentById = crud.restoreById;
export const bulkSoftDeleteStudents = crud.bulkDeleteByIds;
export const bulkRestoreStudents = crud.bulkRestoreByIds;

export async function bulkUpdateStudentStatus(
  ids: string[],
  status: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };

  const outcomes = await Promise.all(
    ids.map(async (id) => {
      const existing = await findStudentById(tenant, id);
      if (!existing || existing.deletedAt) return false;
      const updated = await updateStudentById(id, {
        ...(existing as StudentRecord),
        status,
        id,
      });
      return Boolean(updated);
    }),
  );

  const succeeded = outcomes.filter(Boolean).length;
  return { succeeded, failed: ids.length - succeeded };
}

const hydrated = createContactHydratedService<Student, Student>({
  listByWorkspaceFn: listStudentsByWorkspace,
  findByIdFn: findStudentById,
  findByIdsFn: findStudentsByIds,
  collectContactIdsFn: (row) => [
    row.contactId,
    row.fatherContactId,
    row.motherContactId,
    row.guardianContactId,
  ],
  loadContactsByIdsFn: loadContactsByIds,
  hydrateFn: (row, contacts) => hydrateStudentFromContacts(row, contacts as never),
});

export const loadStudents = hydrated.loadAll;
export const loadStudentById = hydrated.loadById;
export const loadStudentsByIds = hydrated.loadByIds;

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
  const hydratedStudents = await hydrateRecordsFromContacts(
    page.students,
    (row) => [
      row.contactId,
      row.fatherContactId,
      row.motherContactId,
      row.guardianContactId,
    ],
    (row, contacts) => hydrateStudentFromContacts(row, contacts as never),
    loadContactsByIds,
  );
  return {
    ...page,
    students: hydratedStudents,
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

export async function computeNextGrNumberForDate(regDate: string, settings: StudentGrNumberSettings) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return computeNextGrNumber([], settings, regDate);
  }
  const restartAnnually = settings.grNumberRestartAnnually !== false;
  const count = await countStudentsForNextGrNumber(tenant, regDate, restartAnnually);
  const template = settings.grNumberTemplate || '{seq}-{year}';
  const digits = settings.grNumberDigits || 4;
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  const seqStr = String(count + 1).padStart(digits, '0');
  return template.replace('{seq}', seqStr).replace('{year}', String(year));
}

export async function checkStudentRegistrationDuplicate(input: StudentDuplicateCheckInput) {
  const tenant = getRequestTenant();
  if (!tenant) return { reason: null };
  const reason = await findStudentRegistrationConflictSql(tenant, input);
  return { reason };
}

/** One-shot backfill of missing GR numbers for active students (Setup/Work writers). */
export async function migrateStudentsMissingGrNumbers(): Promise<{ updated: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { updated: 0 };

  const rawSettings = await fetchObject(STUDENTS_SETTINGS_KEY);
  const settings = normalizeStudentsSettings(rawSettings);
  const active = await listStudentsByWorkspace(tenant, { deleted: 'active' });
  const updated = backfillMissingStudentGrNumbers(
    active as StudentRecord[],
    {
      grNumberTemplate: settings.grNumberTemplate,
      grNumberDigits: settings.grNumberDigits,
      grNumberRestartAnnually: settings.grNumberRestartAnnually,
    },
    todayISO(),
  );
  if (updated.length === 0) return { updated: 0 };

  await bulkSaveStudents(tenant, updated as Student[]);
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return { updated: updated.length };
}
