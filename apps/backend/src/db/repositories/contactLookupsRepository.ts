import { and, asc, eq } from 'drizzle-orm';
import type { ContactLookupKind } from '@mms/shared';
import { contactLookups } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

export interface ContactLookupRowInput {
  id: string;
  kind: ContactLookupKind;
  label: string;
  meta?: Record<string, unknown> | null;
  sortOrder: number;
}

export async function listContactLookupsByWorkspace(workspaceSubdomain: string) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(contactLookups)
      .where(eq(contactLookups.workspaceSubdomain, subdomain))
      .orderBy(asc(contactLookups.kind), asc(contactLookups.sortOrder));
  });
}

export async function listContactLookupsByKind(
  workspaceSubdomain: string,
  kind: ContactLookupKind,
) {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(contactLookups)
      .where(
        and(
          eq(contactLookups.workspaceSubdomain, subdomain),
          eq(contactLookups.kind, kind),
        ),
      )
      .orderBy(asc(contactLookups.sortOrder));
  });
}

/** Replace one kind's ordered rows inside a single tenant transaction. */
export async function replaceContactLookupsForKind(
  workspaceSubdomain: string,
  kind: ContactLookupKind,
  rows: ContactLookupRowInput[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();

  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(contactLookups)
      .where(
        and(
          eq(contactLookups.workspaceSubdomain, subdomain),
          eq(contactLookups.kind, kind),
        ),
      );

    if (rows.length === 0) return;

    await tx.insert(contactLookups).values(
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
export async function listAllContactLookupsByWorkspace(workspaceSubdomain: string) {
  return listContactLookupsByWorkspace(workspaceSubdomain);
}

/** Admin restore wipe+replace for the whole workspace. */
export async function replaceContactLookupsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const now = new Date();

  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(contactLookups).where(eq(contactLookups.workspaceSubdomain, subdomain));
    if (records.length === 0) return;

    await tx.insert(contactLookups).values(
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
