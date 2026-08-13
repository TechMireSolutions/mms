import { and, eq, ilike, or, sql, isNull, type SQL, desc, asc } from 'drizzle-orm';
import type {
  Account,
  JournalEntry,
  FiscalYear,
  AccountingListQuery,
  AccountingAccountsListPageResult,
  AccountingEntriesListPageResult,
  AccountingFiscalYearsListPageResult,
} from '@mms/shared';
import { accountingAccounts, accountingEntries, accountingFiscalYears } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

function buildAccountListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingAccounts.workspaceSubdomain, subdomain)];
  
  if (!query.includeDeleted) {
    conditions.push(isNull(sql`(${accountingAccounts.customData}->>'deletedAt')`));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingAccounts.id, searchPattern),
        ilike(sql`(${accountingAccounts.customData}->>'name')`, searchPattern),
        ilike(sql`(${accountingAccounts.customData}->>'category')`, searchPattern)
      ) as SQL
    );
  }
  
  return conditions;
}

function buildEntryListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingEntries.workspaceSubdomain, subdomain)];
  
  if (!query.includeDeleted) {
    conditions.push(isNull(sql`(${accountingEntries.customData}->>'deletedAt')`));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingEntries.id, searchPattern),
        ilike(sql`(${accountingEntries.customData}->>'reference')`, searchPattern),
        ilike(sql`(${accountingEntries.customData}->>'description')`, searchPattern)
      ) as SQL
    );
  }
  
  return conditions;
}

function buildFiscalYearListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingFiscalYears.workspaceSubdomain, subdomain)];
  
  if (!query.includeDeleted) {
    conditions.push(isNull(sql`(${accountingFiscalYears.customData}->>'deletedAt')`));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(accountingFiscalYears.id, searchPattern),
        ilike(sql`(${accountingFiscalYears.customData}->>'name')`, searchPattern)
      ) as SQL
    );
  }
  
  return conditions;
}

function buildAccountOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = sql`(${accountingAccounts.customData}->>'createdAt')::timestamp`;
      break;
    case 'id':
      column = accountingAccounts.id as unknown as SQL;
      break;
    case 'name':
      column = sql`(${accountingAccounts.customData}->>'name')`;
      break;
    case 'category':
      column = sql`(${accountingAccounts.customData}->>'category')`;
      break;
    case 'balance':
      column = sql`(${accountingAccounts.customData}->>'balance')::numeric`;
      break;
    default:
      column = sql`(${accountingAccounts.customData}->>'createdAt')::timestamp`;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildEntryOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = sql`(${accountingEntries.customData}->>'createdAt')::timestamp`;
      break;
    case 'id':
      column = accountingEntries.id as unknown as SQL;
      break;
    case 'date':
      column = sql`(${accountingEntries.customData}->>'date')`;
      break;
    case 'reference':
      column = sql`(${accountingEntries.customData}->>'reference')`;
      break;
    case 'totalAmount':
      column = sql`(${accountingEntries.customData}->>'totalAmount')::numeric`;
      break;
    default:
      column = sql`(${accountingEntries.customData}->>'createdAt')::timestamp`;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildFiscalYearOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = sql`(${accountingFiscalYears.customData}->>'createdAt')::timestamp`;
      break;
    case 'id':
      column = accountingFiscalYears.id as unknown as SQL;
      break;
    case 'name':
      column = sql`(${accountingFiscalYears.customData}->>'name')`;
      break;
    case 'startDate':
      column = sql`(${accountingFiscalYears.customData}->>'startDate')`;
      break;
    case 'endDate':
      column = sql`(${accountingFiscalYears.customData}->>'endDate')`;
      break;
    default:
      column = sql`(${accountingFiscalYears.customData}->>'createdAt')::timestamp`;
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

    const items = rows.map((row) => ({
      ...row,
      ...(row.customData as any || {}),
    })) as Account[];

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

    const items = rows.map((row) => ({
      ...row,
      ...(row.customData as any || {}),
    })) as JournalEntry[];

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

    const items = rows.map((row) => ({
      ...row,
      ...(row.customData as any || {}),
    })) as FiscalYear[];

    return {
      fiscalYears: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
