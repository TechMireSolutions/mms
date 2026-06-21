import { describe, expect, it } from 'vitest';
import { filterTeachersForQuery, paginateTeachers, teacherMatchesSearch } from './teachersListQuery.js';
import type { Teacher } from './teacherTypes.js';

const sample: Teacher[] = [
  { id: '1', contactId: 'c1', name: 'Ustad Ali', status: 'active', specialization: 'Hifz', employeeId: 'T-001' },
  { id: '2', contactId: 'c2', name: 'Ustad Ahmed', status: 'inactive', specialization: 'Arabic' },
  { id: '3', contactId: 'c3', name: 'Ustad Hassan', status: 'on_leave', specialization: 'Hifz' },
];

describe('teacherMatchesSearch', () => {
  it('matches name, employee id, and specialization', () => {
    expect(teacherMatchesSearch(sample[0], 'ali')).toBe(true);
    expect(teacherMatchesSearch(sample[0], 't-001')).toBe(true);
    expect(teacherMatchesSearch(sample[0], 'hifz')).toBe(true);
    expect(teacherMatchesSearch(sample[0], 'zzz')).toBe(false);
  });
});

describe('filterTeachersForQuery', () => {
  it('filters by status, specialization, and search', () => {
    expect(filterTeachersForQuery(sample, { status: 'active,on_leave' })).toHaveLength(2);
    expect(filterTeachersForQuery(sample, { specialization: 'Hifz' })).toHaveLength(2);
    expect(filterTeachersForQuery(sample, { search: 'ahmed' })).toHaveLength(1);
  });
});

describe('paginateTeachers', () => {
  it('returns page slice and hasMore', () => {
    const page = paginateTeachers(sample, { page: 1, limit: 2 });
    expect(page.teachers).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(true);
  });
});
