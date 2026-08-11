import { describe, expect, it } from 'vitest';
import {
  isTeachersQuickFilter,
  TEACHERS_QUICK_FILTER_OPTIONS,
  teachersQuickFilterStatusValue,
  TEACHER_SORT_FIELDS,
  TEACHER_SORT_FIELD_SET,
  teachersListQuerySchema,
} from './teachersListQuery.js';

describe('teachersListQuerySchema', () => {
  it('parses list query with status and specialization filters', () => {
    const parsed = teachersListQuerySchema.parse({
      page: '1',
      limit: '50',
      status: 'active,sabbatical',
      specialization: 'Hifz',
      sortField: 'name',
      sortDir: 'asc',
    });
    expect(parsed.status).toBe('active,sabbatical');
    expect(parsed.specialization).toBe('Hifz');
    expect(parsed.sortField).toBe('name');
  });

  it('parses gender and quickFilter filters', () => {
    const parsed = teachersListQuerySchema.parse({
      gender: 'male',
      quickFilter: 'missingEmployeeId',
    });
    expect(parsed.gender).toBe('male');
    expect(parsed.quickFilter).toBe('missingEmployeeId');
  });

  it('rejects an unknown quickFilter preset', () => {
    const result = teachersListQuerySchema.safeParse({
      quickFilter: 'bogus',
    });
    expect(result.success).toBe(false);
  });

  it('rejects sortField outside TEACHER_SORT_FIELDS', () => {
    const result = teachersListQuerySchema.safeParse({
      sortField: 'bogus',
    });
    expect(result.success).toBe(false);
  });
});

describe('TEACHER_SORT_FIELDS', () => {
  it('includes employeeId and exposes a Set for SQL allowlists', () => {
    expect(TEACHER_SORT_FIELDS).toContain('employeeId');
    expect(TEACHER_SORT_FIELD_SET.has('name')).toBe(true);
    expect(TEACHER_SORT_FIELD_SET.has('bogus')).toBe(false);
  });
});

describe('TEACHERS_QUICK_FILTERS', () => {
  it('exposes the status + missing-employee-id presets with label keys', () => {
    expect(TEACHERS_QUICK_FILTER_OPTIONS).toEqual([
      { id: 'all', labelKey: 'teachers.filtersAll' },
      { id: 'active', labelKey: 'teachers.filtersActive' },
      { id: 'inactive', labelKey: 'teachers.filtersInactive' },
      { id: 'onLeave', labelKey: 'teachers.filtersOnLeave' },
      { id: 'missingEmployeeId', labelKey: 'teachers.filtersMissingEmployeeId' },
    ]);
  });

  it('narrows valid preset strings', () => {
    expect(isTeachersQuickFilter('active')).toBe(true);
    expect(isTeachersQuickFilter('all')).toBe(true);
    expect(isTeachersQuickFilter('bogus')).toBe(false);
  });

  it('maps status presets to stored status values and non-status presets to undefined', () => {
    expect(teachersQuickFilterStatusValue('active')).toBe('active');
    expect(teachersQuickFilterStatusValue('inactive')).toBe('inactive');
    expect(teachersQuickFilterStatusValue('onLeave')).toBe('on_leave');
    expect(teachersQuickFilterStatusValue('all')).toBeUndefined();
    expect(teachersQuickFilterStatusValue('missingEmployeeId')).toBeUndefined();
  });
});
