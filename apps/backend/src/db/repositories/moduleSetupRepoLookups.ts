import { and, asc, eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { withTenant } from '../tenant-context.js';

type WorkspaceCol = PgColumn;

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
    updatedAt: PgColumn;
  };
}) {
  const { table } = options;

  async function listByWorkspace(workspaceSubdomain: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenant(subdomain, async (tx) => {
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
  }

  async function listByKind(workspaceSubdomain: string, kind: string) {
    const subdomain = workspaceSubdomain.trim().toLowerCase();
    return withTenant(subdomain, async (tx) => {
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
  }

  return {
    listByWorkspace,
    listByKind,
    replaceForKind,
    listAllByWorkspace,
    replaceForWorkspace,
  };
}
