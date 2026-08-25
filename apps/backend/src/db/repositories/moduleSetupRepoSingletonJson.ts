import { eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { withTenant } from '../tenant-context.js';

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
    return withTenant(subdomain, async (tx) => {
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
    await withTenant(subdomain, async (tx) => {
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
    return withTenant(subdomain, async (tx) => {
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
    await withTenant(subdomain, async (tx) => {
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
