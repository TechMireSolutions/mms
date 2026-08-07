import { and, asc, eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { withTenantTransaction } from '../withTenantTransaction.js';

type WorkspaceCol = PgColumn;
type UpdatedAtCol = PgColumn;

/**
 * Workspace-scoped singleton JSONB row (field-config / module-preferences).
 * `jsonColumn` is the Drizzle property name on the table (`config` or `preferences`).
 */
export function createWorkspaceSingletonJsonRepo(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTable & Record<string, any> & {
    workspaceSubdomain: WorkspaceCol;
    updatedAt: UpdatedAtCol;
  };
  jsonColumn: 'config' | 'preferences';
}) {
  const { table, jsonColumn } = options;

  async function getByWorkspace(
    workspaceSubdomain: string,
  ): Promise<Record<string, unknown> | null> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      const rows = await tx
        .select()
        .from(table)
        .where(eq(table.workspaceSubdomain, subdomain))
        .limit(1);
      const row = rows[0] as Record<string, unknown> | undefined;
      const value = row?.[jsonColumn];
      return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    });
  }

  async function upsert(
    workspaceSubdomain: string,
    json: Record<string, unknown>,
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx
        .insert(table)
        .values({
          workspaceSubdomain: subdomain,
          [jsonColumn]: json,
          updatedAt: now,
        } as never)
        .onConflictDoUpdate({
          target: table.workspaceSubdomain,
          set: { [jsonColumn]: json, updatedAt: now } as never,
        });
    });
  }

  async function listAllByWorkspace(workspaceSubdomain: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      return tx
        .select()
        .from(table)
        .where(eq(table.workspaceSubdomain, subdomain));
    });
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    records: Array<Record<string, unknown>>,
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx.delete(table).where(eq(table.workspaceSubdomain, subdomain));
      const first = records[0];
      if (!first) return;
      const nested = first[jsonColumn];
      const json =
        nested && typeof nested === 'object' && !Array.isArray(nested)
          ? (nested as Record<string, unknown>)
          : first;
      await tx.insert(table).values({
        workspaceSubdomain: subdomain,
        [jsonColumn]: json,
        updatedAt: now,
      } as never);
    });
  }

  return { getByWorkspace, upsert, listAllByWorkspace, replaceForWorkspace };
}

/** Per-user Work column preference rows. */
export function createUserColumnPrefsRepo(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTable & Record<string, any> & {
    workspaceSubdomain: WorkspaceCol;
    userId: WorkspaceCol;
    preferences: PgColumn;
    updatedAt: UpdatedAtCol;
  };
}) {
  const { table } = options;

  async function get(
    workspaceSubdomain: string,
    userId: string,
  ): Promise<unknown[]> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const uid = userId.trim();
    return withTenantTransaction(subdomain, async (tx) => {
      const rows = await tx
        .select()
        .from(table)
        .where(
          and(
            eq(table.workspaceSubdomain, subdomain),
            eq(table.userId, uid),
          ),
        )
        .limit(1);
      const row = rows[0] as { preferences?: unknown } | undefined;
      return Array.isArray(row?.preferences) ? row.preferences : [];
    });
  }

  async function set(
    workspaceSubdomain: string,
    userId: string,
    preferences: unknown[],
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const uid = userId.trim();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx
        .insert(table)
        .values({
          workspaceSubdomain: subdomain,
          userId: uid,
          preferences,
          updatedAt: now,
        } as never)
        .onConflictDoUpdate({
          target: [table.workspaceSubdomain, table.userId],
          set: { preferences, updatedAt: now } as never,
        });
    });
  }

  async function listAllByWorkspace(workspaceSubdomain: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      return tx
        .select()
        .from(table)
        .where(eq(table.workspaceSubdomain, subdomain));
    });
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    records: Array<Record<string, unknown>>,
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
      await tx.delete(table).where(eq(table.workspaceSubdomain, subdomain));
      if (records.length === 0) return;
      await tx.insert(table).values(
        records.map((record) => ({
          workspaceSubdomain: subdomain,
          userId: String(record.userId ?? record.user_id ?? ''),
          preferences: Array.isArray(record.preferences) ? record.preferences : [],
          updatedAt: now,
        })) as never,
      );
    });
  }

  return { get, set, listAllByWorkspace, replaceForWorkspace };
}

export interface ModuleLookupRowInput {
  id: string;
  kind: string;
  label: string;
  meta?: Record<string, unknown> | null;
  sortOrder: number;
}

/** Module Setup lookup option lists (contact_lookups / student_lookups). */
export function createModuleLookupsRepo(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTable & Record<string, any> & {
    workspaceSubdomain: WorkspaceCol;
    id: PgColumn;
    kind: PgColumn;
    label: PgColumn;
    meta: PgColumn;
    sortOrder: PgColumn;
    updatedAt: UpdatedAtCol;
  };
}) {
  const { table } = options;

  async function listByWorkspace(workspaceSubdomain: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      return tx
        .select()
        .from(table)
        .where(eq(table.workspaceSubdomain, subdomain))
        .orderBy(asc(table.kind), asc(table.sortOrder));
    });
  }

  async function listByKind(workspaceSubdomain: string, kind: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenantTransaction(subdomain, async (tx) => {
      return tx
        .select()
        .from(table)
        .where(
          and(
            eq(table.workspaceSubdomain, subdomain),
            eq(table.kind, kind),
          ),
        )
        .orderBy(asc(table.sortOrder));
    });
  }

  async function replaceForKind(
    workspaceSubdomain: string,
    kind: string,
    rows: ModuleLookupRowInput[],
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
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
  }

  async function listAllByWorkspace(workspaceSubdomain: string) {
    return listByWorkspace(workspaceSubdomain);
  }

  async function replaceForWorkspace(
    workspaceSubdomain: string,
    records: Array<Record<string, unknown>>,
  ): Promise<void> {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    const now = new Date();
    await withTenantTransaction(subdomain, async (tx) => {
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
  }

  return {
    listByWorkspace,
    listByKind,
    replaceForKind,
    listAllByWorkspace,
    replaceForWorkspace,
  };
}
