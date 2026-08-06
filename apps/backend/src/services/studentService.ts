import {
  normalizeStoredStudent,
  computeNextGrNumber,
  hydrateStudentFromContacts,
  resolveStudentGuardianLinks,
  normalizeStudentModulePreferences,
  todayISO,
  type Contact,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
  type StudentsListQuery,
  type StudentsWidgetQuery,
  type Student,
  type StudentRecord,
  studentRecordSchema,
} from '@mms/shared';
import { loadContactsByIds } from './contactService.js';
import {
  createGenericRelationalService,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
  saveStudent,
} from '../db/repositories/studentRepository.js';
import {
  listStudentsPage,
  countStudentsActive,
  aggregateStudentsCommandMetrics,
  listActiveStudentsMissingGrNumber,
  bulkUpdateStudentsStatusSql,
} from '../db/repositories/studentRepositoryList.js';
import {
  aggregateStudentsWidgetQueries,
  listStudentLinkedContactIdsSql,
  countStudentsForNextGrNumber,
  findStudentRegistrationConflictSql,
} from '../db/repositories/studentRepositoryWidgets.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastTenantUpdate } from './websocketService.js';
import { loadStudentModulePreferences } from './studentPreferencesService.js';

type ContactWithRelationships = Contact & {
  relationshipContacts?: Array<{ contactId?: string | number; relationship?: string; name?: string }>;
  relationships?: Array<{ contactId?: string | number; relationship?: string; name?: string }>;
};

/**
 * Two-pass hydrate: load primary (+ legacy parent) contacts, derive guardians from
 * Contact relationships, then load any newly discovered guardian contact ids.
 */
async function hydrateStudentsFromContacts(rows: Student[]): Promise<Student[]> {
  if (rows.length === 0) return [];

  const firstPassIds = new Set<string>();
  for (const row of rows) {
    for (const id of [row.contactId, row.fatherContactId, row.motherContactId, row.guardianContactId]) {
      if (id != null && id !== '') firstPassIds.add(String(id));
    }
  }

  let contacts = (
    firstPassIds.size === 0 ? [] : await loadContactsByIds([...firstPassIds])
  ) as ContactWithRelationships[];
  const contactById = new Map(contacts.map((contact) => [String(contact.id), contact]));

  const withDerived = rows.map((row) => {
    const primary =
      row.contactId != null && row.contactId !== ''
        ? contactById.get(String(row.contactId))
        : undefined;
    const guardians = resolveStudentGuardianLinks(row, primary ?? null);
    return {
      ...row,
      fatherContactId: guardians.fatherContactId,
      motherContactId: guardians.motherContactId,
      guardianContactId: guardians.guardianContactId,
      fatherName: guardians.fatherName,
      motherName: guardians.motherName,
      guardianName: guardians.guardianName,
    } as Student;
  });

  const secondPassIds = new Set<string>();
  for (const row of withDerived) {
    for (const id of [row.fatherContactId, row.motherContactId, row.guardianContactId]) {
      if (id != null && id !== '' && !contactById.has(String(id))) {
        secondPassIds.add(String(id));
      }
    }
  }
  if (secondPassIds.size > 0) {
    const more = (await loadContactsByIds([...secondPassIds])) as ContactWithRelationships[];
    contacts = [...contacts, ...more];
  }

  return withDerived.map((row) => hydrateStudentFromContacts(row, contacts as never));
}

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

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (code === '23505') return true;
  const cause = 'cause' in error ? (error as { cause?: unknown }).cause : undefined;
  return isUniqueViolation(cause);
}

function throwGrUniqueConflict(error: unknown): never {
  if (isUniqueViolation(error)) {
    const conflict = new Error('A student with this GR number already exists.') as Error & {
      statusCode: number;
      type: string;
    };
    conflict.statusCode = 409;
    conflict.type = 'conflict';
    throw conflict;
  }
  throw error;
}

export const createStudent = async (record: StudentRecord): Promise<StudentRecord> => {
  try {
    return await crud.create(record);
  } catch (error: unknown) {
    throwGrUniqueConflict(error);
  }
};
export const updateStudentById = async (
  id: string,
  record: StudentRecord,
): Promise<StudentRecord | null> => {
  try {
    return await crud.updateById(id, record);
  } catch (error: unknown) {
    throwGrUniqueConflict(error);
  }
};
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

  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { succeeded: 0, failed: 0 };

  const succeeded = await bulkUpdateStudentsStatusSql(tenant, uniqueIds, status);
  if (succeeded > 0) {
    broadcastTenantUpdate(tenant, 'collection', 'students');
  }
  return { succeeded, failed: uniqueIds.length - succeeded };
}

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

/** One-shot backfill of missing GR numbers for active students (Setup writers). */
export async function migrateStudentsMissingGrNumbers(): Promise<{ updated: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { updated: 0 };

  const settings = normalizeStudentModulePreferences(await loadStudentModulePreferences());
  const missing = await listActiveStudentsMissingGrNumber(tenant);
  if (missing.length === 0) return { updated: 0 };

  const fallbackDate = todayISO();
  const prefs = {
    grNumberTemplate: settings.grNumberTemplate,
    grNumberDigits: settings.grNumberDigits,
    grNumberRestartAnnually: settings.grNumberRestartAnnually,
  };
  let updated = 0;
  for (const row of missing) {
    const registeredDate =
      typeof row.registeredDate === 'string' && row.registeredDate.trim()
        ? row.registeredDate
        : fallbackDate;
    // Persist each row before the next count so SQL next-GR stays monotonic.
    const grNumber = await computeNextGrNumberForDate(registeredDate, prefs);
    try {
      await saveStudent(tenant, { ...row, grNumber });
    } catch (error: unknown) {
      throwGrUniqueConflict(error);
    }
    updated += 1;
  }

  broadcastTenantUpdate(tenant, 'collection', 'students');
  return { updated };
}
