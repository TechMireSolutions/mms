import type { Teacher } from './teacherTypes.js';

export interface TeachersListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Comma-separated status values (e.g. `active,inactive`). */
  status?: string;
  specialization?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TeachersListPageResult {
  teachers: Teacher[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function teacherMatchesSearch(teacher: Teacher, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    (teacher.name ?? '').toLowerCase().includes(q) ||
    (teacher.employeeId ?? '').toLowerCase().includes(q) ||
    (teacher.specialization ?? '').toLowerCase().includes(q)
  );
}

export function filterTeachersForQuery(teachers: Teacher[], query: TeachersListQuery): Teacher[] {
  let rows = teachers;
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      rows = rows.filter((t) => statuses.includes(String(t.status ?? 'active')));
    }
  }
  if (query.specialization) {
    rows = rows.filter((t) => t.specialization === query.specialization);
  }
  if (query.search?.trim()) {
    rows = rows.filter((t) => teacherMatchesSearch(t, query.search!));
  }
  return rows;
}

function compareTeachers(a: Teacher, b: Teacher, field: string, dir: 'asc' | 'desc'): number {
  const av = a[field as keyof Teacher];
  const bv = b[field as keyof Teacher];
  const aStr = av == null ? '' : String(av);
  const bStr = bv == null ? '' : String(bv);
  const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'desc' ? -cmp : cmp;
}

/** Paginates an in-memory teacher list (server-side data source). */
export function paginateTeachers(teachers: Teacher[], query: TeachersListQuery): TeachersListPageResult {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  let rows = filterTeachersForQuery(teachers, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const dir = query.sortDir === 'desc' ? 'desc' : 'asc';
    rows = [...rows].sort((a, b) => compareTeachers(a, b, sortField, dir));
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);
  return {
    teachers: slice,
    total,
    page,
    limit,
    hasMore: start + slice.length < total,
  };
}
