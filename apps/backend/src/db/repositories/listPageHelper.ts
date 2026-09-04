import { and, getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { AnyPgTable, SelectedFields } from 'drizzle-orm/pg-core';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../schema.js';

type AppDb = NodePgDatabase<typeof schema>;

export interface RunListPageOptions<Row, Record> {
  /** WHERE conditions (tenant eq + soft-delete + search + module filters). */
  conditions: SQL[];
  /** ORDER BY expression. */
  orderBy: SQL;
  page?: number;
  limit?: number;
  /** Fallback page size when `limit` is omitted. */
  defaultPageSize?: number;
  /** Explicit column projection to eliminate SELECT * wildcard fetches. */
  columns?: SelectedFields;
  /** Maps a raw Drizzle row to the public record shape (e.g. merge `customData`). */
  rowMapper: (row: Row) => Record;
}

export interface ListPageResult<Record> {
  items: Record[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Shared SQL list-page body: clamp page/limit, `count(*)` + `LIMIT/OFFSET` over
 * the same WHERE, then map rows. Extracted from `financeRepositoryList` /
 * `accountingRepositoryList` so new modules don't copy the 6-step skeleton.
 * Runs inside the caller's `withTenant` (RLS SET LOCAL).
 */
export async function runListPage<Row, Record>(
  tx: AppDb,
  table: AnyPgTable,
  options: RunListPageOptions<Row, Record>,
): Promise<ListPageResult<Record>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(Math.max(1, options.limit ?? options.defaultPageSize ?? 50), 500);
  const offset = (page - 1) * limit;

  const whereClause = and(...options.conditions);

  const countRows = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(whereClause);
  const total = Number(countRows[0]?.count ?? 0);

  // Never fall back to a bare `tx.select()` (SELECT *) wildcard. Project an
  // explicit column object — a caller-supplied projection when provided,
  // otherwise every table column enumerated via getTableColumns — so the SQL
  // always lists columns explicitly and omits nothing the row mapper expects.
  const projection: SelectedFields = options.columns ?? getTableColumns(table);
  const baseQuery = tx.select(projection);
  const rows = await baseQuery
    .from(table)
    .where(whereClause)
    .orderBy(options.orderBy)
    .limit(limit)
    .offset(offset);

  const items = (rows as unknown as Row[]).map(options.rowMapper);

  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

/** Merges a row's `customData` JSONB onto the row (the generic-repo record shape). */
export function mergeCustomData<Row extends { customData?: unknown }>(row: Row): Row {
  return { ...row, ...((row.customData as Record<string, unknown> | null) ?? {}) } as Row;
}