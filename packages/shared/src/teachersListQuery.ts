import type { Teacher } from './teacherTypes.js';
import { compareByField, paginateArray } from './utils.js';

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
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return (
    (teacher.name ?? '').toLowerCase().includes(normalizedSearch) ||
    (teacher.employeeId ?? '').toLowerCase().includes(normalizedSearch) ||
    (teacher.specialization ?? '').toLowerCase().includes(normalizedSearch)
  );
}

export function filterTeachersForQuery(teachers: Teacher[], query: TeachersListQuery): Teacher[] {
  let teacherRows = teachers;
  if (query.status?.trim()) {
    const statuses = query.status.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      teacherRows = teacherRows.filter((teacher) => statuses.includes(String(teacher.status ?? 'active')));
    }
  }
  if (query.specialization) {
    teacherRows = teacherRows.filter((teacher) => teacher.specialization === query.specialization);
  }
  if (query.search?.trim()) {
    teacherRows = teacherRows.filter((teacher) => teacherMatchesSearch(teacher, query.search!));
  }
  return teacherRows;
}

/** Paginates an in-memory teacher list (server-side data source). */
export function paginateTeachers(teachers: Teacher[], query: TeachersListQuery): TeachersListPageResult {
  let teacherRows = filterTeachersForQuery(teachers, query);

  const sortField = query.sortField?.trim();
  if (sortField) {
    const sortDirection = query.sortDir === 'desc' ? 'desc' : 'asc';
    teacherRows = [...teacherRows].sort((leftTeacher, rightTeacher) =>
      compareByField(leftTeacher, rightTeacher, sortField, sortDirection),
    );
  }

  const result = paginateArray(teacherRows, query.page ?? 1, query.limit ?? 50, 500);
  return {
    teachers: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  };
}
