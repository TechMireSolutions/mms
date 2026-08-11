import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createModulePaginatedListOptions,
  type CreateModulePaginatedListOptions,
} from './createModulePaginatedListQuery';

const apiJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiClient', () => ({
  apiJson,
}));

interface TestListParams {
  page: number;
  search?: string;
  enabled?: boolean;
}

function keyParams(params: TestListParams) {
  return { page: params.page, search: params.search?.trim() || '' } as const;
}

function sameFilters(
  previous: ReturnType<typeof keyParams> | undefined,
  next: ReturnType<typeof keyParams>,
): boolean {
  if (!previous) return false;
  return previous.search === next.search;
}

const options: CreateModulePaginatedListOptions<
  { items: string[] },
  TestListParams,
  ReturnType<typeof keyParams>
> = {
  queryKey: (params) => ['students', 'page', keyParams(params)],
  keyParams,
  sameFilters,
  buildUrl: (params) => `/api/students?page=${params.page}&search=${params.search ?? ''}`,
  staleTime: 15_000,
};

describe('createModulePaginatedListOptions', () => {
  beforeEach(() => {
    apiJson.mockReset();
  });

  it('builds the query key from the module key builder', () => {
    const query = createModulePaginatedListOptions(options, { page: 2, search: 'ali' }, true);

    expect(query.queryKey).toEqual(['students', 'page', { page: 2, search: 'ali' }]);
  });

  it('enables only when authenticated and not explicitly disabled', () => {
    expect(createModulePaginatedListOptions(options, { page: 1 }, true).enabled).toBe(true);
    expect(createModulePaginatedListOptions(options, { page: 1 }, false).enabled).toBe(false);
    expect(createModulePaginatedListOptions(options, { page: 1, enabled: false }, true).enabled).toBe(
      false,
    );
  });

  it('fetches the SQL page URL', async () => {
    const query = createModulePaginatedListOptions(options, { page: 3, search: '  zim ' }, true);
    const queryFn = query.queryFn as (context: { signal: AbortSignal }) => Promise<{
      items: string[];
    }>;
    apiJson.mockResolvedValueOnce({ items: ['a'] });

    await queryFn({ signal: new AbortController().signal });

    expect(apiJson).toHaveBeenCalledWith('/api/students?page=3&search=  zim ', {
      signal: expect.any(AbortSignal),
    });
  });

  it('reuses previous page data only when filters match', () => {
    const query = createModulePaginatedListOptions(options, { page: 2, search: 'ali' }, true);
    const placeholder = query.placeholderData as unknown as (
      prevData: { items: string[] } | undefined,
      prevQuery: { queryKey: readonly unknown[] } | undefined,
    ) => { items: string[] } | undefined;
    const previousQuery = {
      queryKey: ['students', 'page', { page: 1, search: 'ali' }],
    };
    const otherQuery = {
      queryKey: ['students', 'page', { page: 1, search: 'bob' }],
    };

    expect(placeholder({ items: ['a'] }, previousQuery)).toEqual({ items: ['a'] });
    expect(placeholder({ items: ['a'] }, otherQuery)).toBeUndefined();
  });

  it('drops previous page data when there is no previous query', () => {
    const query = createModulePaginatedListOptions(options, { page: 1 }, true);
    const placeholder = query.placeholderData as unknown as (
      prevData: { items: string[] } | undefined,
      prevQuery: { queryKey: readonly unknown[] } | undefined,
    ) => { items: string[] } | undefined;

    expect(placeholder({ items: ['a'] }, undefined)).toBeUndefined();
  });
});
