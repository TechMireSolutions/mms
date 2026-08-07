import { describe, expect, it } from 'vitest';
import {
  filterStudentsForQuery,
  paginateStudents,
  studentMatchesSearch,
  studentsListQuerySchema,
} from './studentsListQuery.js';
import type { Student } from './studentTypes.js';

const sample: Student[] = [
  { id: '1', contactId: 'c1', name: 'Ali Khan', status: 'active', gender: 'male', cnic: '12345', grNumber: '0001-2026', studentId: 'ST-9' },
  { id: '2', contactId: 'c2', name: 'Sara Ahmed', status: 'inactive', gender: 'female', fatherName: 'Ahmed' },
  { id: '3', contactId: 'c3', name: 'Hassan Ali', status: 'suspended', gender: 'male', guardianName: 'Uncle Bob' },
];

describe('studentsListQuerySchema', () => {
  it('accepts status and gender filters', () => {
    expect(
      studentsListQuerySchema.parse({
        page: '1',
        limit: '25',
        status: 'active,inactive',
        gender: 'male',
        search: 'ali',
      }),
    ).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 25,
        status: 'active,inactive',
        gender: 'male',
        search: 'ali',
      }),
    );
  });

  it('rejects oversized status', () => {
    expect(studentsListQuerySchema.safeParse({ status: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('studentMatchesSearch', () => {
  it('matches name, cnic, grNumber, studentId, father, and guardian', () => {
    expect(studentMatchesSearch(sample[0], 'ali')).toBe(true);
    expect(studentMatchesSearch(sample[0], '12345')).toBe(true);
    expect(studentMatchesSearch(sample[0], '0001-2026')).toBe(true);
    expect(studentMatchesSearch(sample[0], 'st-9')).toBe(true);
    expect(studentMatchesSearch(sample[1], 'ahmed')).toBe(true);
    expect(studentMatchesSearch(sample[2], 'uncle')).toBe(true);
    expect(studentMatchesSearch(sample[0], 'zzz')).toBe(false);
  });
});

describe('filterStudentsForQuery', () => {
  it('filters by status, gender, and search', () => {
    expect(filterStudentsForQuery(sample, { status: 'active,inactive' })).toHaveLength(2);
    expect(filterStudentsForQuery(sample, { gender: 'male' })).toHaveLength(2);
    expect(filterStudentsForQuery(sample, { search: 'sara' })).toHaveLength(1);
  });
});

describe('paginateStudents', () => {
  it('returns page slice and hasMore', () => {
    const page = paginateStudents(sample, { page: 1, limit: 2 });
    expect(page.students).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(true);

    const page2 = paginateStudents(sample, { page: 2, limit: 2 });
    expect(page2.students).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
  });
});
