import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModuleWidgetAggregatesQuery } from './createModuleWidgetAggregatesQuery';

const apiJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiClient', () => ({
  apiJson,
}));

interface TestWidget {
  id: string;
  operation: 'count' | 'sum';
  targetField?: string;
  filterValue?: string;
}

const buildQuery = createModuleWidgetAggregatesQuery<TestWidget, { value: number }>({
  apiBase: '/api/students',
  queryKey: ['students', 'widget-aggregates'],
  collection: 'students',
  toWidgetQuery: (widget) => ({
    id: widget.id,
    operation: widget.operation,
    targetField: widget.targetField,
    filterValue: widget.filterValue,
  }),
});

describe('createModuleWidgetAggregatesQuery', () => {
  beforeEach(() => {
    apiJson.mockReset();
  });

  it('filters widget inputs to the configured collection', () => {
    const query = buildQuery(
      [
        { id: 'w1', collection: 'students', operation: 'count' },
        { id: 'other', collection: 'contacts', operation: 'sum' },
      ],
      true,
    );

    expect(query.enabled).toBe(true);
    // Query key embeds only the students widget.
    expect(JSON.stringify(query.queryKey)).toContain('w1');
    expect(JSON.stringify(query.queryKey)).not.toContain('other');
  });

  it('produces an order-independent query-key signature', () => {
    const a = buildQuery(
      [
        { id: 'w-b', collection: 'students', operation: 'count' },
        { id: 'w-a', collection: 'students', operation: 'sum' },
      ],
      true,
    );
    const b = buildQuery(
      [
        { id: 'w-a', collection: 'students', operation: 'sum' },
        { id: 'w-b', collection: 'students', operation: 'count' },
      ],
      true,
    );

    expect(a.queryKey).toEqual(b.queryKey);
  });

  it('disables the query when disabled or when no widgets match the collection', () => {
    expect(buildQuery([], true).enabled).toBe(false);
    expect(
      buildQuery([{ id: 'w1', collection: 'students', operation: 'count' }], false).enabled,
    ).toBe(false);
  });

  it('POSTs the mapped widget queries and falls back to {} for a missing results payload', async () => {
    const query = buildQuery(
      [{ id: 'w1', collection: 'students', operation: 'sum', targetField: 'fees' }],
      true,
    );
    const queryFn = query.queryFn as (context: { signal: AbortSignal }) => Promise<{
      [x: string]: { value: number };
    }>;
    apiJson.mockResolvedValueOnce({ results: { w1: { value: 12 } } });
    apiJson.mockResolvedValueOnce(undefined);

    await expect(queryFn({ signal: new AbortController().signal })).resolves.toEqual({
      w1: { value: 12 },
    });
    await expect(queryFn({ signal: new AbortController().signal })).resolves.toEqual({});

    expect(apiJson).toHaveBeenNthCalledWith(1, '/api/students/widget-aggregates', {
      method: 'POST',
      body: JSON.stringify({
        widgets: [{ id: 'w1', operation: 'sum', targetField: 'fees', filterValue: undefined }],
      }),
      signal: expect.any(AbortSignal),
    });
  });

  it('applies the default 30s stale time', () => {
    expect(buildQuery([{ id: 'w1', collection: 'students', operation: 'count' }], true).staleTime).toBe(
      30_000,
    );
  });
});
