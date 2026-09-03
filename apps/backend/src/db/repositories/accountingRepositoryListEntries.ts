import { and, eq, inArray, sql } from 'drizzle-orm';
import type {
  AccountingListQuery,
  AccountingEntriesListPageResult,
} from '@mms/shared';
import {
  accountingEntries,
  accountingJournalLines,
  accountingEntryTags,
  accountingEntryAttachments,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { entryRowToRecord, type JournalLineRow } from './accountingRepository.js';
import { buildEntryListConditions, buildEntryOrderBy } from './accountingRepositoryListQuery.js';

export async function listEntriesPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingEntriesListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenant(subdomain, async (tx) => {
    const conditions = buildEntryListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildEntryOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(accountingEntries)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

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
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return {
        entries: [],
        total,
        page,
        limit,
        hasMore: false,
      };
    }

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

    const items = rows.map((r) =>
      entryRowToRecord(
        r,
        linesByEntry.get(r.id) ?? [],
        tagsByEntry.get(r.id) ?? [],
        attachmentsByEntry.get(r.id) ?? [],
      ),
    );

    return {
      entries: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
