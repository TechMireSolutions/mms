import { and, eq, isNull, sql } from 'drizzle-orm';
import type { AccountingReportAggregates } from '@mms/shared';
import { accountingAccounts, accountingEntries, accountingJournalLines } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';

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

  return withTenantRead(subdomain, async (tx) => {
    const dateFrom = query.dateFrom?.trim() || undefined;
    const dateTo = query.dateTo?.trim() || undefined;
    const entryDateFilter = and(
      dateFrom ? sql`${accountingEntries.date} >= ${dateFrom}` : undefined,
      dateTo ? sql`${accountingEntries.date} <= ${dateTo}` : undefined,
    );

    // Only posted, non-deleted entries within the date range may contribute to
    // the trial balance. These filters must live in an INNER join / derived
    // table: placing them in the ON clause of a LEFT JOIN (the previous code)
    // retained every journal line with NULL entry columns and summed draft,
    // deleted, and out-of-period rows.
    const postedLines = tx
      .select({
        workspaceSubdomain: accountingJournalLines.workspaceSubdomain,
        accountId: accountingJournalLines.accountId,
        debit: accountingJournalLines.debit,
        credit: accountingJournalLines.credit,
      })
      .from(accountingJournalLines)
      .innerJoin(
        accountingEntries,
        and(
          eq(accountingJournalLines.workspaceSubdomain, accountingEntries.workspaceSubdomain),
          eq(accountingJournalLines.entryId, accountingEntries.id),
          isNull(accountingEntries.deletedAt),
          eq(accountingEntries.status, 'posted'),
          entryDateFilter,
        ),
      )
      .as('posted_lines');

    // Trial balance by account
    const trialBalanceRows = await tx
      .select({
        id: accountingAccounts.id,
        code: accountingAccounts.code,
        name: accountingAccounts.name,
        type: accountingAccounts.type,
        totalDebit: sql<number>`coalesce(sum(${postedLines.debit}), 0)::float8`,
        totalCredit: sql<number>`coalesce(sum(${postedLines.credit}), 0)::float8`,
      })
      .from(accountingAccounts)
      .leftJoin(
        postedLines,
        and(
          eq(postedLines.workspaceSubdomain, accountingAccounts.workspaceSubdomain),
          eq(postedLines.accountId, accountingAccounts.id),
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
