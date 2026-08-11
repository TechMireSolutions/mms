import type { UseQueryOptions } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';

/** Module widget input — a widget query plus the FE-only `collection` filter. */
export type ModuleWidgetAggregateWidgetInput<W> = W & { collection: string };

export interface CreateModuleWidgetAggregatesOptions<W, R> {
  /** REST base path (`/api/students` / `/api/contacts`). */
  apiBase: string;
  /** Base query key the widget-aggregates key is derived from. */
  queryKey: readonly unknown[];
  /** Collection name used to filter widget inputs (`students` / `contacts`). */
  collection: string;
  /** Shared `*WidgetQueryFromWidget` mapper (SSOT in `@mms/shared`). */
  toWidgetQuery: (widget: ModuleWidgetAggregateWidgetInput<W>) => W;
  /** Stable query-key signature; defaults to a sorted id/target/filter fingerprint. */
  signatureOf?: (queries: W[]) => string;
}

/** Deterministic key signature — order-independent so widget reordering is a cache hit. */
type WidgetSignatureRow = {
  id: string;
  targetField?: unknown;
  filterValue?: unknown;
  filterOperator?: unknown;
  xAxisField?: unknown;
};

function stableWidgetSignature(queries: WidgetSignatureRow[]): string {
  return JSON.stringify(
    [...queries]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((query) => ({
        id: query.id,
        target: query.targetField,
        filter: query.filterValue,
        filterOperator: query.filterOperator,
        xAxis: query.xAxisField,
      })),
  );
}

/**
 * Shared `/widget-aggregates` query factory (server aggregates per widget).
 *
 * Contacts and Students analytics hooks were ~90% identical hand-rolled `useQuery`
 * blocks; both now wrap this factory so payload shape, key signature, enabled
 * rules and staleness live in one place.
 */
export function createModuleWidgetAggregatesQuery<W extends { id: string }, R>({
  apiBase,
  queryKey,
  collection,
  toWidgetQuery,
  signatureOf = (queries: W[]) => stableWidgetSignature(queries),
}: CreateModuleWidgetAggregatesOptions<W, R>) {
  return function buildWidgetAggregatesQuery(
    widgets: ModuleWidgetAggregateWidgetInput<W>[],
    enabled = true,
  ): UseQueryOptions<Record<string, R>> {
    const queries = widgets
      .filter((widget) => widget.collection === collection)
      .map((widget) => toWidgetQuery(widget));
    const querySignature = signatureOf(queries);

    return {
      queryKey: [...queryKey, querySignature] as const,
      queryFn: async ({ signal }) => {
        const aggregateResponse = await apiJson<{ results: Record<string, R> }>(
          `${apiBase}/widget-aggregates`,
          {
            method: 'POST',
            body: JSON.stringify({ widgets: queries }),
            signal,
          },
        );
        return aggregateResponse?.results ?? {};
      },
      enabled: enabled && queries.length > 0,
      staleTime: 30_000,
    };
  };
}
