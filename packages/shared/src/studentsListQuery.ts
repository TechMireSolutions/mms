import type { Student } from './studentTypes.js';

export interface StudentsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Comma-separated status values (e.g. `active,inactive`). */
  status?: string;
  gender?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
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
    studentRows = studentRows.filter((student) => student.gender === query.gender);
  }
  if (query.search?.trim()) {
    studentRows = studentRows.filter((student) => studentMatchesSearch(student, query.search!));
  }
  return studentRows;
}

function compareStudents(leftStudent: Student, rightStudent: Student, field: string, direction: 'asc' | 'desc'): number {
  const leftValue = leftStudent[field as keyof Student];
  const rightValue = rightStudent[field as keyof Student];
  const leftString = leftValue == null ? '' : String(leftValue);
  const rightString = rightValue == null ? '' : String(rightValue);
  const comparison = leftString.localeCompare(rightString, undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'desc' ? -comparison : comparison;
}

/** Paginates an in-memory student list (server-side data source). */
export function paginateStudents(students: Student[], query: StudentsListQuery): StudentsListPageResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  let studentRows = filterStudentsForQuery(students, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const sortDirection = query.sortDir === 'desc' ? 'desc' : 'asc';
    studentRows = [...studentRows].sort((leftStudent, rightStudent) =>
      compareStudents(leftStudent, rightStudent, sortField, sortDirection),
    );
  }

  const total = studentRows.length;
  const start = (page - 1) * limit;
  const pageStudents = studentRows.slice(start, start + limit);
  return {
    students: pageStudents,
    total,
    page,
    limit,
    hasMore: start + pageStudents.length < total,
  };
}
