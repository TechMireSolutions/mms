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
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    (student.name ?? '').toLowerCase().includes(q) ||
    (student.cnic ?? '').includes(q) ||
    (student.fatherName ?? '').toLowerCase().includes(q) ||
    (student.guardianName ?? '').toLowerCase().includes(q)
  );
}

export function filterStudentsForQuery(students: Student[], query: StudentsListQuery): Student[] {
  let rows = students;
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      rows = rows.filter((s) => statuses.includes(String(s.status ?? 'active')));
    }
  }
  if (query.gender) {
    rows = rows.filter((s) => s.gender === query.gender);
  }
  if (query.search?.trim()) {
    rows = rows.filter((s) => studentMatchesSearch(s, query.search!));
  }
  return rows;
}

function compareStudents(a: Student, b: Student, field: string, dir: 'asc' | 'desc'): number {
  const av = a[field as keyof Student];
  const bv = b[field as keyof Student];
  const aStr = av == null ? '' : String(av);
  const bStr = bv == null ? '' : String(bv);
  const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'desc' ? -cmp : cmp;
}

/** Paginates an in-memory student list (server-side data source). */
export function paginateStudents(students: Student[], query: StudentsListQuery): StudentsListPageResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  let rows = filterStudentsForQuery(students, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((a, b) => compareStudents(a, b, sortField, dir));
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);
  return {
    students: slice,
    total,
    page,
    limit,
    hasMore: start + slice.length < total,
  };
}
