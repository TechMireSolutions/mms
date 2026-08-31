import { and, eq, isNull, sql } from 'drizzle-orm';
import type { AccountingReportAggregates } from '@mms/shared';
import { accountingAccounts, accountingEntries, accountingJournalLines } from '../schema.js';
import { withTenant } from '../tenant-context.js';

export interface AccountingReportQuery {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * SQL aggregates for Accounting Reports tier (Trial Balance & Financial Statements).
 */
export async function aggregateAccountingReport(
  tenant: string,
  query: AccountingReportQuery = {},
): Promise<AccountingReportAggregates> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenant(subdomain, async (tx) => {
    const entryDateFilter = and(
      query.dateFrom ? sql`${accountingEntries.date} >= ${query.dateFrom}` : undefined,
      query.dateTo ? sql`${accountingEntries.date} <= ${query.dateTo}` : undefined,
    );

    // Trial balance by account
    const trialBalanceRows = await tx
      .select({
        id: accountingAccounts.id,
        code: accountingAccounts.code,
        name: accountingAccounts.name,
        type: accountingAccounts.type,
        totalDebit: sql<number>`coalesce(sum(${accountingJournalLines.debit}), 0)::float8`,
        totalCredit: sql<number>`coalesce(sum(${accountingJournalLines.credit}), 0)::float8`,
      })
      .from(accountingAccounts)
      .leftJoin(
        accountingJournalLines,
        and(
          eq(accountingJournalLines.workspaceSubdomain, accountingAccounts.workspaceSubdomain),
          eq(accountingJournalLines.accountId, accountingAccounts.id),
        ),
      )
      .leftJoin(
        accountingEntries,
        and(
          eq(accountingJournalLines.workspaceSubdomain, accountingEntries.workspaceSubdomain),
          eq(accountingJournalLines.entryId, accountingEntries.id),
          isNull(accountingEntries.deletedAt),
          eq(accountingEntries.status, 'posted'),
          entryDateFilter,
        ),
      )
      .where(
        and(
          eq(accountingAccounts.workspaceSubdomain, subdomain),
          isNull(accountingAccounts.deletedAt),
        ),
      )
      .groupBy(
        accountingAccounts.id,
        accountingAccounts.code,
        accountingAccounts.name,
        accountingAccounts.type,
      )
      .orderBy(accountingAccounts.code);

    const trialBalance = trialBalanceRows.map((r) => {
      const isDebitNormal = r.type === 'Asset' || r.type === 'Expense';
      const balance = isDebitNormal
        ? Number(r.totalDebit) - Number(r.totalCredit)
        : Number(r.totalCredit) - Number(r.totalDebit);
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        totalDebit: Number(r.totalDebit),
        totalCredit: Number(r.totalCredit),
        balance,
      };
    });

    let revenue = 0;
    let expenses = 0;
    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const row of trialBalance) {
      if (row.type === 'Revenue') revenue += row.totalCredit - row.totalDebit;
      else if (row.type === 'Expense') expenses += row.totalDebit - row.totalCredit;
      else if (row.type === 'Asset') assets += row.totalDebit - row.totalCredit;
      else if (row.type === 'Liability') liabilities += row.totalCredit - row.totalDebit;
      else if (row.type === 'Equity') equity += row.totalCredit - row.totalDebit;
    }

    const netSurplus = revenue - expenses;
    const cashInflow = revenue;
    const cashOutflow = expenses;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      revenue,
      expenses,
      netSurplus,
      assets,
      liabilities,
      equity: equity + netSurplus,
      cashInflow,
      cashOutflow,
      netCashFlow,
      trialBalance,
    };
  });
}
