import type {
  AccountingListQuery,
  AccountingAccountsListPageResult,
  AccountingFiscalYearsListPageResult,
} from '@mms/shared';
import { accountingAccounts, accountingFiscalYears } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { runListPage } from './listPageHelper.js';
import {
  accountRowToRecord,
  fiscalYearRowToRecord,
} from './accountingRepository.js';
import {
  buildAccountListConditions,
  buildAccountOrderBy,
  buildFiscalYearListConditions,
  buildFiscalYearOrderBy,
} from './accountingRepositoryListQuery.js';

export async function listAccountsPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingAccountsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    const result = await runListPage(tx, accountingAccounts, {
      conditions: buildAccountListConditions(subdomain, query),
      orderBy: buildAccountOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 12,
      rowMapper: accountRowToRecord,
    });

    return {
      accounts: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}

export async function listFiscalYearsPage(
  tenant: string,
  query: AccountingListQuery,
): Promise<AccountingFiscalYearsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    const result = await runListPage(tx, accountingFiscalYears, {
      conditions: buildFiscalYearListConditions(subdomain, query),
      orderBy: buildFiscalYearOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 12,
      rowMapper: fiscalYearRowToRecord,
    });

    return {
      fiscalYears: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}
