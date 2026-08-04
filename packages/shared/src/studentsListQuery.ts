import type { Student } from './studentTypes.js';
import { compareByField, paginateArray } from './utils.js';

export interface StudentsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Comma-separated status values (e.g. `active,inactive`). */
  status?: string;
  gender?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  /** When true, SQL list returns deleted-only rows (Work trash). */
  includeDeleted?: boolean;
}

export interface StudentsListPageResult {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function studentMatchesSearch(student: Student, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return (
    (student.name ?? '').toLowerCase().includes(normalizedSearch) ||
    (student.cnic ?? '').includes(normalizedSearch) ||
    (student.grNumber ?? '').toLowerCase().includes(normalizedSearch) ||
    (student.studentId ?? '').toLowerCase().includes(normalizedSearch) ||
    (student.fatherName ?? '').toLowerCase().includes(normalizedSearch) ||
    (student.guardianName ?? '').toLowerCase().includes(normalizedSearch)
  );
}

export function filterStudentsForQuery(students: Student[], query: StudentsListQuery): Student[] {
  let studentRows = students;
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      studentRows = studentRows.filter((student) => statuses.includes(String(student.status ?? 'active')));
    }
  }
  if (query.gender) {
    const genderFilter = query.gender.trim().toLowerCase();
    studentRows = studentRows.filter(
      (student) => (student.gender ?? '').trim().toLowerCase() === genderFilter,
    );
  }
  if (query.search?.trim()) {
    studentRows = studentRows.filter((student) => studentMatchesSearch(student, query.search!));
  }
  return studentRows;
}

/** Paginates an in-memory student list (server-side data source). */
export function paginateStudents(students: Student[], query: StudentsListQuery): StudentsListPageResult {
  let studentRows = filterStudentsForQuery(students, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const sortDirection = query.sortDir === 'desc' ? 'desc' : 'asc';
    studentRows = [...studentRows].sort((leftStudent, rightStudent) =>
      compareByField(leftStudent, rightStudent, sortField, sortDirection),
    );
  }

  const result = paginateArray(studentRows, query.page ?? 1, query.limit ?? 50, 500);
  return {
    students: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
