import { and, asc, eq } from 'drizzle-orm';
import type { StudentLookupKind } from '@mms/shared';
import { studentLookups } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface StudentLookupRowInput {
  id: string;
  kind: StudentLookupKind;
  label: string;
  meta?: Record<string, unknown> | null;
  sortOrder: number;
}

export async function listStudentLookupsByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(studentLookups)
      .where(eq(studentLookups.workspaceSubdomain, subdomain))
      .orderBy(asc(studentLookups.kind), asc(studentLookups.sortOrder));
  });
}

export async function listStudentLookupsByKind(
  workspaceSubdomain: string,
  kind: StudentLookupKind,
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(studentLookups)
      .where(
        and(
          eq(studentLookups.workspaceSubdomain, subdomain),
          eq(studentLookups.kind, kind),
        ),
      )
      .orderBy(asc(studentLookups.sortOrder));
  });
}

/** Replace one kind's ordered rows inside a single tenant transaction. */
export async function replaceStudentLookupsForKind(
  workspaceSubdomain: string,
  kind: StudentLookupKind,
  rows: StudentLookupRowInput[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();

  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(studentLookups)
      .where(
        and(
          eq(studentLookups.workspaceSubdomain, subdomain),
          eq(studentLookups.kind, kind),
        ),
      );

    if (rows.length === 0) return;

    await tx.insert(studentLookups).values(
      rows.map((row) => ({
        id: row.id,
        workspaceSubdomain: subdomain,
        kind: row.kind,
        label: row.label,
        meta: row.meta ?? null,
        sortOrder: row.sortOrder,
        updatedAt: now,
      })),
    );
  });
}

/** Full-workspace list for admin backup snapshots. */
export async function listAllStudentLookupsByWorkspace(workspaceSubdomain: string) {
  return listStudentLookupsByWorkspace(workspaceSubdomain);
}

/** Admin restore wipe+replace for the whole workspace. */
export async function replaceStudentLookupsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();

  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(studentLookups).where(eq(studentLookups.workspaceSubdomain, subdomain));
    if (records.length === 0) return;

    await tx.insert(studentLookups).values(
      records.map((record, index) => ({
        id: String(record.id ?? `${subdomain}:lookup:${index}`),
        workspaceSubdomain: subdomain,
        kind: String(record.kind ?? ''),
        label: String(record.label ?? ''),
        meta: (record.meta as Record<string, unknown> | null | undefined) ?? null,
        sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : index,
        updatedAt: now,
      })),
    );
  });
}
