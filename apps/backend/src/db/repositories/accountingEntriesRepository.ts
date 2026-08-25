import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type JournalEntry } from '@mms/shared';
import {
  accountingEntries,
  accountingJournalLines,
  accountingEntryTags,
  accountingEntryAttachments,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

type EntryRow = typeof accountingEntries.$inferSelect;

export function entryRowToRecord(
  row: EntryRow,
  lines: Array<typeof accountingJournalLines.$inferSelect> = [],
  tags: string[] = [],
  attachments: string[] = [],
): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    ref: row.ref,
    description: row.description,
    status: row.status as JournalEntry['status'],
    created_by: row.createdBy,
    fiscal_year: row.fiscalYear,
    transaction_type: row.transactionType ?? undefined,
    reversed_ref: row.reversedRef ?? undefined,
    simple_mode: row.simpleMode,
    lines: lines.map((l) => ({
      id: l.id,
      account_id: l.accountId,
      debit: Number(l.debit ?? 0),
      credit: Number(l.credit ?? 0),
      description: l.description,
    })),
    tags,
    attachments,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listEntriesByWorkspace(tenant: string): Promise<JournalEntry[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), isNull(accountingEntries.deletedAt)));
    if (rows.length === 0) return [];

    const entryIds = rows.map((r) => r.id);
    const [allLines, allTags, allAttachments] = await Promise.all([
      tx
        .select()
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            inArray(accountingJournalLines.entryId, entryIds),
          ),
        ),
      tx
        .select()
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            inArray(accountingEntryTags.entryId, entryIds),
          ),
        ),
      tx
        .select()
        .from(accountingEntryAttachments)
        .where(
          and(
            eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
            inArray(accountingEntryAttachments.entryId, entryIds),
          ),
        ),
    ]);

    const linesByEntry = new Map<string, Array<typeof accountingJournalLines.$inferSelect>>();
    for (const line of allLines) {
      const arr = linesByEntry.get(line.entryId) ?? [];
      arr.push(line);
      linesByEntry.set(line.entryId, arr);
    }

    const tagsByEntry = new Map<string, string[]>();
    for (const t of allTags) {
      const arr = tagsByEntry.get(t.entryId) ?? [];
      arr.push(t.tag);
      tagsByEntry.set(t.entryId, arr);
    }

    const attachmentsByEntry = new Map<string, string[]>();
    for (const a of allAttachments) {
      const arr = attachmentsByEntry.get(a.entryId) ?? [];
      arr.push(a.url);
      attachmentsByEntry.set(a.entryId, arr);
    }

    return rows.map((r) =>
      entryRowToRecord(
        r,
        linesByEntry.get(r.id) ?? [],
        tagsByEntry.get(r.id) ?? [],
        attachmentsByEntry.get(r.id) ?? [],
      ),
    );
  });
}

export async function findEntryById(tenant: string, id: string): Promise<JournalEntry | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), eq(accountingEntries.id, id)));
    const row = rows[0];
    if (!row) return null;

    const [lines, tags, attachments] = await Promise.all([
      tx
        .select()
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            eq(accountingJournalLines.entryId, id),
          ),
        ),
      tx
        .select()
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            eq(accountingEntryTags.entryId, id),
          ),
        ),
      tx
        .select()
        .from(accountingEntryAttachments)
        .where(
          and(
            eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
            eq(accountingEntryAttachments.entryId, id),
          ),
        ),
    ]);

    return entryRowToRecord(
      row,
      lines,
      tags.map((t) => t.tag),
      attachments.map((a) => a.url),
    );
  });
}
