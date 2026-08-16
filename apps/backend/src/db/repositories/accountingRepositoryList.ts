import { and, eq, ilike, or, isNull, isNotNull, type SQL, desc, asc, sql, inArray } from 'drizzle-orm';
import type {
  AccountingListQuery,
  AccountingAccountsListPageResult,
  AccountingEntriesListPageResult,
  AccountingFiscalYearsListPageResult,
} from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
  accountingJournalLines,
  accountingEntryTags,
  accountingEntryAttachments,
} from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import {
  accountRowToRecord,
  fiscalYearRowToRecord,
  entryRowToRecord,
} from './accountingRepository.js';

function buildAccountListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingAccounts.workspaceSubdomain, subdomain)];
  
  if (query.includeDeleted) {
    conditions.push(isNotNull(accountingAccounts.deletedAt));
  } else {
    conditions.push(isNull(accountingAccounts.deletedAt));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingAccounts.id, searchPattern),
        ilike(accountingAccounts.code, searchPattern),
        ilike(accountingAccounts.name, searchPattern),
        ilike(accountingAccounts.type, searchPattern),
        ilike(accountingAccounts.subtype, searchPattern),
      ) as SQL,
    );
  }
  
  return conditions;
}

function buildEntryListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingEntries.workspaceSubdomain, subdomain)];
  
  if (query.includeDeleted) {
    conditions.push(isNotNull(accountingEntries.deletedAt));
  } else {
    conditions.push(isNull(accountingEntries.deletedAt));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingEntries.id, searchPattern),
        ilike(accountingEntries.ref, searchPattern),
        ilike(accountingEntries.description, searchPattern),
        ilike(accountingEntries.fiscalYear, searchPattern),
      ) as SQL,
    );
  }
  
  return conditions;
}

function buildFiscalYearListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingFiscalYears.workspaceSubdomain, subdomain)];
  
  if (query.includeDeleted) {
    conditions.push(isNotNull(accountingFiscalYears.deletedAt));
  } else {
    conditions.push(isNull(accountingFiscalYears.deletedAt));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingFiscalYears.id, searchPattern),
        ilike(accountingFiscalYears.label, searchPattern),
      ) as SQL,
    );
  }
  
  return conditions;
}

function buildAccountOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = accountingAccounts.createdAt as unknown as SQL;
      break;
    case 'id':
      column = accountingAccounts.id as unknown as SQL;
      break;
    case 'code':
      column = accountingAccounts.code as unknown as SQL;
      break;
    case 'name':
      column = accountingAccounts.name as unknown as SQL;
      break;
    case 'type':
      column = accountingAccounts.type as unknown as SQL;
      break;
    default:
      column = accountingAccounts.createdAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildEntryOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = accountingEntries.createdAt as unknown as SQL;
      break;
    case 'id':
      column = accountingEntries.id as unknown as SQL;
      break;
    case 'date':
      column = accountingEntries.date as unknown as SQL;
      break;
    case 'ref':
    case 'reference':
      column = accountingEntries.ref as unknown as SQL;
      break;
    case 'status':
      column = accountingEntries.status as unknown as SQL;
      break;
    default:
      column = accountingEntries.createdAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildFiscalYearOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = accountingFiscalYears.createdAt as unknown as SQL;
      break;
    case 'id':
      column = accountingFiscalYears.id as unknown as SQL;
      break;
    case 'label':
    case 'name':
      column = accountingFiscalYears.label as unknown as SQL;
      break;
    case 'startDate':
      column = accountingFiscalYears.startDate as unknown as SQL;
      break;
    case 'endDate':
      column = accountingFiscalYears.endDate as unknown as SQL;
      break;
    case 'status':
      column = accountingFiscalYears.status as unknown as SQL;
      break;
    default:
      column = accountingFiscalYears.createdAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

export async function listAccountsPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingAccountsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildAccountListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildAccountOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(accountingAccounts)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(accountingAccounts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const items = rows.map(accountRowToRecord);

    return {
      accounts: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function listEntriesPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingEntriesListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildEntryListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildEntryOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(accountingEntries)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
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

export async function listFiscalYearsPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingFiscalYearsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildFiscalYearListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildFiscalYearOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(accountingFiscalYears)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(accountingFiscalYears)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const items = rows.map(fiscalYearRowToRecord);

    return {
      fiscalYears: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
