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

export type JournalLineRow = {
  id: string;
  accountId: string;
  debit?: string | number | null;
  credit?: string | number | null;
  description?: string | null;
};

export function entryRowToRecord(
  row: EntryRow,
  lines: JournalLineRow[] = [],
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
      description: l.description ?? '',
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

export async function listEntriesByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<JournalEntry[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: accountingEntries.id,
        workspaceSubdomain: accountingEntries.workspaceSubdomain,
        date: accountingEntries.date,
        ref: accountingEntries.ref,
        description: accountingEntries.description,
        status: accountingEntries.status,
        createdBy: accountingEntries.createdBy,
        fiscalYear: accountingEntries.fiscalYear,
        transactionType: accountingEntries.transactionType,
        reversedRef: accountingEntries.reversedRef,
        simpleMode: accountingEntries.simpleMode,
        deletedAt: accountingEntries.deletedAt,
        deletedBy: accountingEntries.deletedBy,
        deletionReason: accountingEntries.deletionReason,
        createdAt: accountingEntries.createdAt,
        updatedAt: accountingEntries.updatedAt,
      })
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), isNull(accountingEntries.deletedAt)))
      .limit(limit)
      .offset(offset);
    if (rows.length === 0) return [];

    const entryIds = rows.map((r) => r.id);
    const [allLines, allTags, allAttachments] = await Promise.all([
      tx
        .select({
          id: accountingJournalLines.id,
          entryId: accountingJournalLines.entryId,
          accountId: accountingJournalLines.accountId,
          debit: accountingJournalLines.debit,
          credit: accountingJournalLines.credit,
          description: accountingJournalLines.description,
        })
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            inArray(accountingJournalLines.entryId, entryIds),
          ),
        ),
      tx
        .select({
          entryId: accountingEntryTags.entryId,
          tag: accountingEntryTags.tag,
        })
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            inArray(accountingEntryTags.entryId, entryIds),
          ),
        ),
      tx
        .select({
          entryId: accountingEntryAttachments.entryId,
          url: accountingEntryAttachments.url,
        })
        .from(accountingEntryAttachments)
        .where(
          and(
            eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
            inArray(accountingEntryAttachments.entryId, entryIds),
          ),
        ),
    ]);

    const linesByEntry = new Map<string, JournalLineRow[]>();
    for (const line of allLines) {
      const arr = linesByEntry.get(line.entryId) ?? [];
      arr.push(line);
      linesByEntry.set(line.entryId, arr);
    }

    const tagsByEntry = new Map<string, string[]>();
    for (const tag of allTags) {
      const arr = tagsByEntry.get(tag.entryId) ?? [];
      arr.push(tag.tag);
      tagsByEntry.set(tag.entryId, arr);
    }

    const attachmentsByEntry = new Map<string, string[]>();
    for (const att of allAttachments) {
      const arr = attachmentsByEntry.get(att.entryId) ?? [];
      arr.push(att.url);
      attachmentsByEntry.set(att.entryId, arr);
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
      .select({
        id: accountingEntries.id,
        workspaceSubdomain: accountingEntries.workspaceSubdomain,
        date: accountingEntries.date,
        ref: accountingEntries.ref,
        description: accountingEntries.description,
        status: accountingEntries.status,
        createdBy: accountingEntries.createdBy,
        fiscalYear: accountingEntries.fiscalYear,
        transactionType: accountingEntries.transactionType,
        reversedRef: accountingEntries.reversedRef,
        simpleMode: accountingEntries.simpleMode,
        deletedAt: accountingEntries.deletedAt,
        deletedBy: accountingEntries.deletedBy,
        deletionReason: accountingEntries.deletionReason,
        createdAt: accountingEntries.createdAt,
        updatedAt: accountingEntries.updatedAt,
      })
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), eq(accountingEntries.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const [lines, tags, attachments] = await Promise.all([
      tx
        .select({
          id: accountingJournalLines.id,
          entryId: accountingJournalLines.entryId,
          accountId: accountingJournalLines.accountId,
          debit: accountingJournalLines.debit,
          credit: accountingJournalLines.credit,
          description: accountingJournalLines.description,
        })
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            eq(accountingJournalLines.entryId, id),
          ),
        ),
      tx
        .select({
          entryId: accountingEntryTags.entryId,
          tag: accountingEntryTags.tag,
        })
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            eq(accountingEntryTags.entryId, id),
          ),
        ),
      tx
        .select({
          entryId: accountingEntryAttachments.entryId,
          url: accountingEntryAttachments.url,
        })
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
