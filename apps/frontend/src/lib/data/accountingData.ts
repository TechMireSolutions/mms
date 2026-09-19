export const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

export const ACCOUNT_SUBTYPES: Record<AccountType, string[]> = {
  Asset:     ["Current Asset", "Fixed Asset", "Contra Asset", "Other Asset"],
  Liability: ["Current Liability", "Long-term Liability", "Other Liability"],
  Equity:    ["Owner's Equity", "Retained Earnings", "Other Equity"],
  Revenue:   ["Operating Revenue", "Non-operating Revenue", "Other Revenue"],
  Expense:   ["Operating Expense", "Administrative Expense", "Financial Expense", "Other Expense"],
};

export const ACCOUNT_TYPE_META = {
  Asset:     { normalBalance: "debit",  color: "bg-info/15 text-info border-info/30",       group: "balance" as const, icon: "🏦" },
  Liability: { normalBalance: "credit", color: "bg-destructive/15 text-destructive border-destructive/30", group: "balance" as const, icon: "💳" },
  Equity:    { normalBalance: "credit", color: "bg-primary/15 text-primary border-primary/30", group: "balance" as const, icon: "📊" },
  Revenue:   { normalBalance: "credit", color: "bg-success/15 text-success border-success/30", group: "income" as const,  icon: "💰" },
  Expense:   { normalBalance: "debit",  color: "bg-warning/15 text-warning border-warning/30", group: "income" as const,  icon: "📉" },
};

import {
  type Account,
  type JournalLine,
  type JournalEntry,
  type FiscalYear,
  type AccountingSettings,
  DEFAULT_ACCOUNTING_SETTINGS as DEFAULT_SETTINGS,
  moneyToCents,
  todayISO,
} from "@mms/shared";


export type { Account, JournalLine, JournalEntry, FiscalYear, AccountingSettings };
export { DEFAULT_SETTINGS };

/**
 * Convert integer cents back to a money number for display/export.
 *
 * Every arithmetic site below accumulates cents via `moneyToCents` and converts
 * exactly once here, so ledger figures are never float artefacts such as
 * `0.30000000000000004`.
 */
export function centsToMoney(cents: number): number {
  return cents / 100;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

/**
 * Journal tags offered by the entry form and the tag filter.
 *
 * `Expense` replaced the "Other expense" quick action's old `Capital` tag: the
 * quick-action panel and cashbook read direction from tags, and `Capital` means
 * money IN (an owner contribution), so a posted expense was rendered as a green
 * inflow. The money-in and money-out tag sets are now disjoint.
 */
export const JOURNAL_TAGS = ["Payroll", "Fees", "Donation", "Obligation", "Utilities", "Rent", "Capital", "Expense", "Adjustment", "Reversal", "Opening"];

export function computeLedger(
  accountId: string,
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
): {
  id: string;
  date: string;
  ref: string;
  description: string;
  lineDesc?: string;
  debit: number;
  credit: number;
}[] {
  const result: {
    id: string;
    date: string;
    ref: string;
    description: string;
    lineDesc?: string;
    debit: number;
    credit: number;
  }[] = [];
  const postedEntries = entries.filter(e => e.status === "posted");
  postedEntries.forEach(entry => {
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;
    entry.lines.forEach(line => {
      if (line.account_id === accountId) {
        result.push({
          id: line.id,
          date: entry.date,
          ref: entry.ref,
          description: entry.description,
          lineDesc: line.description,
          // Cent-exact line money: the ledger view accumulates these lines into
          // a running balance, so float noise here would reach the exported CSV.
          debit: centsToMoney(moneyToCents(line.debit)),
          credit: centsToMoney(moneyToCents(line.credit))
        });
      }
    });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build the correcting entry for `entry`.
 *
 * The reversal is created **posted**, not as a draft. Every ledger, report and
 * trial-balance view counts posted rows only, so a draft reversal left the wrong
 * original figure as the only thing in the books and hid the correction inside
 * the journal list. Swapped debit/credit lines are balanced by construction and
 * the server accepts a balanced posted write into an open period; a closed
 * period is refused there and now surfaced to the user.
 */
export function createReversalEntry(entry: JournalEntry, allEntries: JournalEntry[]): JournalEntry {
  const count = allEntries.filter(e => e.ref.startsWith("REV-")).length + 1;
  const nextRef = `REV-${entry.ref}-${count}`;
  const reversedLines = entry.lines.map(line => ({
    id: `line_${Math.random().toString(36).substring(2, 9)}`,
    account_id: line.account_id,
    debit: line.credit,
    credit: line.debit,
    description: `Reversal of line in entry ${entry.ref}`
  }));
  return {
    id: `je_${Math.random().toString(36).substring(2, 9)}`,
    date: todayISO(),
    ref: nextRef,

    description: `Reversal of Entry ${entry.ref}: ${entry.description}`,
    status: "posted",
    source_type: "reversal",
    created_by: "System",
    tags: ["Reversal"],
    attachments: [],
    fiscal_year: entry.fiscal_year,
    // Carry the resolved fiscal-year FK too: without it the now-posted reversal
    // relies on label/date resolution to land inside the right period.
    fiscal_year_id: entry.fiscal_year_id,
    lines: reversedLines,
    reversed_ref: entry.ref
  };
}

/** True when another entry already reverses `entry` (guards double reversal). */
export function hasReversalEntry(entry: JournalEntry, allEntries: JournalEntry[]): boolean {
  return allEntries.some(
    (candidate) => candidate.id !== entry.id && candidate.reversed_ref === entry.ref,
  );
}

export function generateJERef(entries: JournalEntry[]): string {
  const journalEntries = entries.filter((entry) => entry.ref.startsWith("JE-"));
  let maxId = 0;
  journalEntries.forEach((entry) => {
    const referenceNumber = parseInt(entry.ref.substring(3));
    if (!isNaN(referenceNumber) && referenceNumber > maxId) maxId = referenceNumber;
  });
  return `JE-${(maxId + 1).toString().padStart(4, "0")}`;
}

export function computeTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
): {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}[] {
  const result = accounts.map(acc => {
    // Integer cents: a float accumulator can report a trial balance that is off
    // by 1e-14 and print drift as a "Difference".
    let debitCents = 0;
    let creditCents = 0;
    const posted = entries.filter(e => e.status === "posted");
    posted.forEach(entry => {
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;
      entry.lines.forEach(line => {
        if (line.account_id === acc.id) {
          debitCents += moneyToCents(line.debit);
          creditCents += moneyToCents(line.credit);
        }
      });
    });
    const netCents = debitCents - creditCents;
    const balanceCents = (acc.type === "Asset" || acc.type === "Expense") ? netCents : -netCents;
    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      totalDebit: centsToMoney(debitCents),
      totalCredit: centsToMoney(creditCents),
      balance: centsToMoney(balanceCents)
    };
  });
  return result.sort((a, b) => a.code.localeCompare(b.code));
}

export function computeFinancials(
  accounts: Account[],
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
) {
  const tb = computeTrialBalance(accounts, entries, dateFrom, dateTo);
  // Aggregate in integer cents and convert once, so the dashboard's figures are
  // exact money instead of a float sum of float sums.
  let assetCents = 0, liabilityCents = 0, equityCents = 0, revenueCents = 0, expenseCents = 0;
  tb.forEach(r => {
    const netCents = moneyToCents(r.totalDebit) - moneyToCents(r.totalCredit);
    if (r.type === "Asset") assetCents += netCents;
    else if (r.type === "Liability") liabilityCents -= netCents;
    else if (r.type === "Equity") equityCents -= netCents;
    else if (r.type === "Revenue") revenueCents -= netCents;
    else if (r.type === "Expense") expenseCents += netCents;
  });
  const assets = centsToMoney(assetCents);
  const liabilities = centsToMoney(liabilityCents);
  const equity = centsToMoney(equityCents);
  const revenue = centsToMoney(revenueCents);
  const expenses = centsToMoney(expenseCents);
  const netSurplus = centsToMoney(revenueCents - expenseCents);
  const netCashFlow = centsToMoney(assetCents - liabilityCents);

  // Track cash inflows and outflows
  let cashInflowCents = 0;
  let cashOutflowCents = 0;
  const cashAccounts = accounts.filter(a => a.type === "Asset" && (a.code.startsWith("10") || a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank")));
  const cashAccountIds = new Set(cashAccounts.map(a => a.id));
  const posted = entries.filter(e => e.status === "posted");
  posted.forEach(entry => {
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;
    entry.lines.forEach(line => {
      if (cashAccountIds.has(line.account_id)) {
        cashInflowCents += moneyToCents(line.debit);
        cashOutflowCents += moneyToCents(line.credit);
      }
    });
  });

  return {
    revenue,
    expenses,
    netSurplus,
    assets,
    liabilities,
    equity,
    netCashFlow,
    cashInflow: centsToMoney(cashInflowCents),
    cashOutflow: centsToMoney(cashOutflowCents),
    tb,
  };
}
