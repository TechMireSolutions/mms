import { and, asc, eq, getTableName } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { redisGet, redisSet, redisDelPattern, redisKeys } from '../../lib/redis.js';

type WorkspaceCol = PgColumn;

const SETUP_LOOKUPS_CACHE_TTL_SECONDS = 300;

export interface ModuleLookupRowInput {
  id: string;
  kind: string;
  label: string;
  meta?: Record<string, unknown> | null;
  sortOrder: number;
}

export interface ModuleLookupDbRow {
  id: string;
  workspaceSubdomain: string;
  kind: string;
  label: string;
  meta: Record<string, unknown> | null;
  sortOrder: number;
  updatedAt: Date;
}

/** Module Setup lookup option lists (contact_lookups / student_lookups). */
export function createModuleLookupsRepo(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTable & Record<string, any> & {
    id: PgColumn;
    workspaceSubdomain: WorkspaceCol;
    kind: PgColumn;
    label: PgColumn;
    meta: PgColumn;
    sortOrder: PgColumn;
    updatedAt: PgColumn;
  };
}) {
  const { table } = options;
  const tableName = getTableName(table);
  const allCacheKey = (sub: string) => redisKeys.setupLookupsAll(sub, tableName);
  const kindCacheKey = (sub: string, kind: string) => redisKeys.setupLookupsKind(sub, tableName, kind);

  async function listByWorkspace(workspaceSubdomain: string): Promise<ModuleLookupDbRow[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const key = allCacheKey(subdomain);
    const cached = await redisGet(key);
    if (cached) {
      try {
        return JSON.parse(cached) as ModuleLookupDbRow[];
      } catch {
        // Fall through on JSON parse error
      }
    }

    const rows = await withTenantRead(subdomain, async (tx) => {
      return tx
        .select({
          id: table.id,
          workspaceSubdomain: table.workspaceSubdomain,
          kind: table.kind,
          label: table.label,
          meta: table.meta,
          sortOrder: table.sortOrder,
          updatedAt: table.updatedAt,
        })
        .from(table)
        .where(eq(table.workspaceSubdomain, subdomain))
        .orderBy(asc(table.kind), asc(table.sortOrder));
    });

    if (rows) {
      await redisSet(key, JSON.stringify(rows), SETUP_LOOKUPS_CACHE_TTL_SECONDS);
    }
    return rows as ModuleLookupDbRow[];
  }

  async function listByKind(workspaceSubdomain: string, kind: string): Promise<ModuleLookupDbRow[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const key = kindCacheKey(subdomain, kind);
    const cached = await redisGet(key);
    if (cached) {
      try {
        return JSON.parse(cached) as ModuleLookupDbRow[];
      } catch {
        // Fall through on JSON parse error
      }
    }

    const rows = await withTenantRead(subdomain, async (tx) => {
      return tx
        .select({
          id: table.id,
          workspaceSubdomain: table.workspaceSubdomain,
          kind: table.kind,
          label: table.label,
          meta: table.meta,
          sortOrder: table.sortOrder,
          updatedAt: table.updatedAt,
        })
        .from(table)
        .where(
          and(
            eq(table.workspaceSubdomain, subdomain),
            eq(table.kind, kind),
          ),
        )
        .orderBy(asc(table.sortOrder));
    });

    if (rows) {
      await redisSet(key, JSON.stringify(rows), SETUP_LOOKUPS_CACHE_TTL_SECONDS);
    }
    return rows as ModuleLookupDbRow[];
  }

  async function replaceForKind(
    workspaceSubdomain: string,
    kind: string,
    rows: ModuleLookupRowInput[],
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenant(subdomain, async (tx) => {
      await tx
        .delete(table)
        .where(
          and(
            eq(table.workspaceSubdomain, subdomain),
            eq(table.kind, kind),
          ),
        );
      if (rows.length === 0) return;
      await tx.insert(table).values(
        rows.map((row) => ({
          id: row.id,
          workspaceSubdomain: subdomain,
          kind: row.kind,
          label: row.label,
          meta: row.meta ?? null,
          sortOrder: row.sortOrder,
          updatedAt: now,
        })) as never,
      );
    });
    await redisDelPattern(redisKeys.setupPattern(subdomain, tableName));
  }

  async function listAllByWorkspace(workspaceSubdomain: string): Promise<ModuleLookupDbRow[]> {
    return listByWorkspace(workspaceSubdomain);
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    records: Array<Record<string, unknown>>,
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenant(subdomain, async (tx) => {
      await tx.delete(table).where(eq(table.workspaceSubdomain, subdomain));
      if (records.length === 0) return;
      await tx.insert(table).values(
        records.map((record, index) => ({
          id: String(record.id ?? `${subdomain}:lookup:${index}`),
          workspaceSubdomain: subdomain,
          kind: String(record.kind ?? ''),
          label: String(record.label ?? ''),
          meta: (record.meta as Record<string, unknown> | null | undefined) ?? null,
          sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : index,
          updatedAt: now,
        })) as never,
      );
    });
    await redisDelPattern(redisKeys.setupPattern(subdomain, tableName));
  }

  return {
    listByWorkspace,
    listByKind,
    replaceForKind,
    listAllByWorkspace,
    replaceForWorkspace,
  };
}
