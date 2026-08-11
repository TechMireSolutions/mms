import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTeachersPageUrl,
  fetchTeacherById,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
  type TeachersPaginatedParams,
} from '@/tenant/features/teachers/hooks/teachersListQueryBuilders';

const apiJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiClient', () => ({
  apiJson,
}));

const base: TeachersPaginatedParams = { page: 1 };

describe('buildTeachersPageUrl', () => {
  it('builds the base teachers URL with default page size', () => {
    expect(buildTeachersPageUrl({ page: 3 })).toBe('/api/teachers?page=3&limit=50');
  });

  it('appends every optional filter', () => {
    const url = buildTeachersPageUrl({
      page: 2,
      limit: 50,
      search: '  ali  ',
      status: 'active,on_leave',
      specialization: 'Hifz',
      sortField: 'employeeId',
      sortDir: 'desc',
      includeDeleted: true,
    });
    expect(url).toBe(
      '/api/teachers?page=2&limit=50&search=ali&status=active%2Con_leave&specialization=Hifz&sortField=employeeId&sortDir=desc&includeDeleted=true',
    );
  });

  it('omits empty filters', () => {
    const url = buildTeachersPageUrl({ page: 1, search: '   ' });
    expect(url).toBe('/api/teachers?page=1&limit=50');
  });
});

describe('teachersListQueryKeyParams', () => {
  it('normalizes defaults and drops enabled', () => {
    expect(teachersListQueryKeyParams({ page: 1, enabled: true })).toEqual({
      page: 1,
      limit: 50,
      search: '',
      status: '',
      specialization: '',
      sortField: '',
      sortDir: '',
      includeDeleted: false,
    });
  });

  it('trims strings and coerces includeDeleted', () => {
    const params = teachersListQueryKeyParams({
      page: 2,
      search: '  zain  ',
      status: ' active ',
      specialization: ' Tajweed ',
      sortField: ' name ' as 'name',
      sortDir: 'desc',
      includeDeleted: true,
    });
    expect(params.search).toBe('zain');
    expect(params.status).toBe('active');
    expect(params.specialization).toBe('Tajweed');
    expect(params.sortField).toBe('name');
    expect(params.sortDir).toBe('desc');
    expect(params.includeDeleted).toBe(true);
  });
});

describe('teachersPaginatedQueryKey', () => {
  it('is a tuple prefixed by the teachers query key', () => {
    const key = teachersPaginatedQueryKey({ page: 1 });
    expect(key).toBeInstanceOf(Array);
    expect(key[0]).toBe('teachers');
    expect(key[1]).toBe('list');
    expect(key[2]).toBe('page');
    expect(key[3]).toMatchObject({ page: 1 });
  });
});

describe('sameTeachersListFilters', () => {
  it('returns false for undefined previous', () => {
    expect(sameTeachersListFilters(undefined, teachersListQueryKeyParams(base))).toBe(false);
  });

  it('returns true for identical params', () => {
    const params = teachersListQueryKeyParams({ page: 1, search: 'a' });
    expect(sameTeachersListFilters(params, teachersListQueryKeyParams({ page: 1, search: 'a' }))).toBe(true);
  });

  it('returns false when a filter differs', () => {
    const params = teachersListQueryKeyParams({ page: 1, search: 'a' });
    expect(sameTeachersListFilters(params, teachersListQueryKeyParams({ page: 1, search: 'b' }))).toBe(false);
  });
});

describe('fetchTeacherById', () => {
  beforeEach(() => {
    apiJson.mockReset();
  });

  it('unwraps the teacher', async () => {
    apiJson.mockResolvedValue({ teacher: { id: 't1', status: 'active' } });
    const teacher = await fetchTeacherById('t1');
    expect(apiJson).toHaveBeenCalledWith('/api/teachers/t1', { signal: undefined });
    expect(teacher).toEqual({ id: 't1', status: 'active' });
  });
});
