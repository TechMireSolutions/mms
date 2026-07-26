import {
  normalizeStoredStudent,
  computeStudentsWidgetAggregates,
  paginateStudents,
  computeNextGrNumber,
  findStudentRegistrationConflict,
  collectStudentLinkedContactIds,
  hydrateStudentFromContacts,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
  type StudentsListQuery,
  type StudentsWidgetQuery,
  type Student,
  type StudentRecord,
  studentRecordSchema,
} from '@mms/shared';
import { loadContacts } from './contactService.js';
import {
  createGenericRelationalService,
  createContactHydratedService,
  type GenericServiceOptions,
} from './genericRelationalService.js';
import {
  listStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
  saveStudent,
} from '../db/repositories/studentRepository.js';
import { getRequestTenant } from '../lib/tenantContext.js';

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

const hydrated = createContactHydratedService<Student, StudentRecord>({
  listByWorkspaceFn: listStudentsByWorkspace,
  findByIdFn: findStudentById,
  findByIdsFn: findStudentsByIds,
  loadContactsFn: loadContacts,
  hydrateFn: (row, contacts) => hydrateStudentFromContacts(row as never, contacts as never) as unknown as StudentRecord,
});

export const loadStudents = hydrated.loadAll;
export const loadStudentById = hydrated.loadById;
export const loadStudentsByIds = hydrated.loadByIds;

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').StudentsWidgetAggregateResult>> {
  const rows = await loadStudents();
  return computeStudentsWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadStudentsPage(query: StudentsListQuery & { includeDeleted?: boolean }) {
  const rows = await loadStudents({ includeDeleted: query.includeDeleted });
  return paginateStudents(rows as import('@mms/shared').Student[], query);
}



export async function loadStudentLinkedContactIds(excludeStudentId?: string) {
  const all = await loadStudents();
  return collectStudentLinkedContactIds(all, excludeStudentId);
}

export async function computeNextGrNumberForDate(regDate: string, settings: StudentGrNumberSettings) {
  const all = await loadStudents();
  return computeNextGrNumber(all, settings, regDate);
}

export async function checkStudentRegistrationDuplicate(input: StudentDuplicateCheckInput) {
  const all = await loadStudents();
  return { reason: findStudentRegistrationConflict(all, input) };
}
