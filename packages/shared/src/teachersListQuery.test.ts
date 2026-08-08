import { describe, expect, it } from 'vitest';
import {
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
