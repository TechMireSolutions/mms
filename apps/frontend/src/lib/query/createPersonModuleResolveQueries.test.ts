import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPersonResolveByIdsOptions } from './createPersonModuleResolveQueries';

const apiJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiClient', () => ({
  apiJson,
}));

interface TestRecord {
  id: string;
  label: string;
}

const options = {
  moduleQueryKey: ['students'],
  apiBase: '/api/students',
  responseKey: 'students',
  toHydrated: (rows: TestRecord[]) => rows.map((row) => ({ ...row, hydrated: true })),
  chunkSize: 2,
} as const;

const NO_CHUNK_OPTIONS = { ...options, chunkSize: undefined } as const;

describe('createPersonResolveByIdsOptions', () => {
  beforeEach(() => {
    apiJson.mockReset();
  });

  it('builds a query key from the module key and the normalized id signature', () => {
    const query = createPersonResolveByIdsOptions(options, ['b', 'a'], true);
    expect(query.queryKey).toEqual(['students', 'resolve', 'b,a']);
  });

  it('enables only when authenticated and ids are present', () => {
    expect(createPersonResolveByIdsOptions(options, ['a'], true).enabled).toBe(true);
    expect(createPersonResolveByIdsOptions(options, ['a'], false).enabled).toBe(false);
    expect(createPersonResolveByIdsOptions(options, [], true).enabled).toBe(false);
  });

  it('POSTs all ids in a single request when no chunk size is set', async () => {
    const query = createPersonResolveByIdsOptions(NO_CHUNK_OPTIONS, ['a', 'b', 'c'], true);
    apiJson.mockResolvedValueOnce({ students: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

    const queryFn = query.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({ signal: new AbortController().signal })).resolves.toEqual([
      { id: 'a', hydrated: true },
      { id: 'b', hydrated: true },
      { id: 'c', hydrated: true },
    ]);

    expect(apiJson).toHaveBeenCalledTimes(1);
    expect(apiJson).toHaveBeenCalledWith('/api/students/resolve', {
      method: 'POST',
      body: JSON.stringify({ ids: ['a', 'b', 'c'] }),
      signal: expect.any(AbortSignal),
    });
  });

  it('splits ids into sequential chunked POSTs preserving row order across chunks', async () => {
    const query = createPersonResolveByIdsOptions(options, ['1', '2', '3', '4', '5'], true);
    apiJson.mockResolvedValueOnce({ students: [{ id: '1' }, { id: '2' }] });
    apiJson.mockResolvedValueOnce({ students: [{ id: '3' }, { id: '4' }] });
    apiJson.mockResolvedValueOnce({ students: [{ id: '5' }] });

    const queryFn = query.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({ signal: new AbortController().signal })).resolves.toEqual([
      { id: '1', hydrated: true },
      { id: '2', hydrated: true },
      { id: '3', hydrated: true },
      { id: '4', hydrated: true },
      { id: '5', hydrated: true },
    ]);

    expect(apiJson).toHaveBeenCalledTimes(3);
    expect(apiJson).toHaveBeenNthCalledWith(1, '/api/students/resolve', {
      method: 'POST',
      body: JSON.stringify({ ids: ['1', '2'] }),
      signal: expect.any(AbortSignal),
    });
    expect(apiJson).toHaveBeenNthCalledWith(2, '/api/students/resolve', {
      method: 'POST',
      body: JSON.stringify({ ids: ['3', '4'] }),
      signal: expect.any(AbortSignal),
    });
    expect(apiJson).toHaveBeenNthCalledWith(3, '/api/students/resolve', {
      method: 'POST',
      body: JSON.stringify({ ids: ['5'] }),
      signal: expect.any(AbortSignal),
    });
  });

  it('falls back to an empty array when the response key is missing', async () => {
    const query = createPersonResolveByIdsOptions(options, ['1'], true);
    apiJson.mockResolvedValueOnce({});

    const queryFn = query.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({ signal: new AbortController().signal })).resolves.toEqual([]);
  });

  it('applies the default 30s stale time', () => {
    expect(createPersonResolveByIdsOptions(options, ['a'], true).staleTime).toBe(30_000);
  });
});
