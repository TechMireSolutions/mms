import { eq, ilike, or, isNull, isNotNull, type SQL, desc, asc } from 'drizzle-orm';
import { isQueryFlagTrue, type AccountingListQuery } from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
} from '../schema.js';

export function buildAccountListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingAccounts.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
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

export function buildEntryListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingEntries.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
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

export function buildFiscalYearListConditions(subdomain: string, query: AccountingListQuery): SQL[] {
  const conditions: SQL[] = [eq(accountingFiscalYears.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
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

export function buildAccountOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
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

export function buildEntryOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
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

export function buildFiscalYearOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
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
