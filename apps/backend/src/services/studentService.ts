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
} from '@mms/shared';
import {
  type StudentRecord,
  studentRecordSchema,
} from '../validation/studentSchemas.js';
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

const hydrated = createContactHydratedService<any, any>({
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
