import { eq, inArray } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { getRootDb } from '../database.js';
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
        .select({
          [jsonColumn]: table[jsonColumn],
        })
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

  async function getByWorkspaces(
    workspaceSubdomains: string[],
  ): Promise<Map<string, Record<string, unknown>>> {
    const subdomains = workspaceSubdomains.map((s) => s.trim().toLowerCase()).filter(Boolean);
    const result = new Map<string, Record<string, unknown>>();
    if (subdomains.length === 0) return result;

    const db = getRootDb();
    const rows = await db
      .select({
        workspaceSubdomain: table.workspaceSubdomain,
        [jsonColumn]: table[jsonColumn],
      })
      .from(table)
      .where(inArray(table.workspaceSubdomain, subdomains));
    for (const row of rows as Record<string, unknown>[]) {
      const sub = typeof row?.workspaceSubdomain === 'string' ? row.workspaceSubdomain.toLowerCase() : '';
      const value = row?.[jsonColumn];
      if (sub && value && typeof value === 'object' && !Array.isArray(value)) {
        result.set(sub, value as Record<string, unknown>);
      }
    }
    return result;
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
        .select({
          workspaceSubdomain: table.workspaceSubdomain,
          [jsonColumn]: table[jsonColumn],
          updatedAt: table.updatedAt,
        })
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

  return { getByWorkspace, getByWorkspaces, upsert, listAllByWorkspace, replaceForWorkspace };
}
