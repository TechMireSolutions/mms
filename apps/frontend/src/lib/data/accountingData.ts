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
  Asset:     { normalBalance: "debit",  color: "bg-info/15 text-info border-info/30",       group: "Balance Sheet",    icon: "🏦" },
  Liability: { normalBalance: "credit", color: "bg-destructive/15 text-destructive border-destructive/30",           group: "Balance Sheet",    icon: "💳" },
  Equity:    { normalBalance: "credit", color: "bg-primary/15 text-primary border-primary/30", group: "Balance Sheet",    icon: "📊" },
  Revenue:   { normalBalance: "credit", color: "bg-success/15 text-success border-success/30", group: "Income Statement", icon: "💰" },
  Expense:   { normalBalance: "debit",  color: "bg-warning/15 text-warning border-warning/30",     group: "Income Statement", icon: "📉" },
};

import {
  type Account,
  type JournalLine,
  type JournalEntry,
  type FiscalYear,
  type AccountingSettings,
  DEFAULT_ACCOUNTING_SETTINGS as DEFAULT_SETTINGS
} from "@mms/shared";

export type { Account, JournalLine, JournalEntry, FiscalYear, AccountingSettings };
export { DEFAULT_SETTINGS };

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export const CHART_OF_ACCOUNTS: Account[] = [];
export const JOURNAL_TAGS = ["Payroll", "Fees", "Donation", "Obligation", "Utilities", "Rent", "Capital", "Adjustment", "Reversal", "Opening"];
export const JOURNAL_ENTRIES: JournalEntry[] = [];

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
          debit: line.debit,
          credit: line.credit
        });
      }
    });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

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
    date: new Date().toISOString().split("T")[0],
    ref: nextRef,
    description: `Reversal of Entry ${entry.ref}: ${entry.description}`,
    status: "draft",
    created_by: "System",
    tags: ["Reversal"],
    attachments: [],
    fiscal_year: entry.fiscal_year,
    lines: reversedLines,
    reversed_ref: entry.ref
  };
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
    let totalDebit = 0;
    let totalCredit = 0;
    const posted = entries.filter(e => e.status === "posted");
    posted.forEach(entry => {
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;
      entry.lines.forEach(line => {
        if (line.account_id === acc.id) {
          totalDebit += line.debit;
          totalCredit += line.credit;
        }
      });
    });
    const net = totalDebit - totalCredit;
    const balance = (acc.type === "Asset" || acc.type === "Expense") ? net : -net;
    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      totalDebit,
      totalCredit,
      balance
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
  let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
  tb.forEach(r => {
    const net = r.totalDebit - r.totalCredit;
    if (r.type === "Asset") assets += net;
    else if (r.type === "Liability") liabilities -= net;
    else if (r.type === "Equity") equity -= net;
    else if (r.type === "Revenue") revenue -= net;
    else if (r.type === "Expense") expenses += net;
  });
  const netSurplus = revenue - expenses;
  const netCashFlow = assets - liabilities;

  // Track cash inflows and outflows
  let cashInflow = 0;
  let cashOutflow = 0;
  const cashAccounts = accounts.filter(a => a.type === "Asset" && (a.code.startsWith("10") || a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank")));
  const cashAccountIds = new Set(cashAccounts.map(a => a.id));
  const posted = entries.filter(e => e.status === "posted");
  posted.forEach(entry => {
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;
    entry.lines.forEach(line => {
      if (cashAccountIds.has(line.account_id)) {
        cashInflow += line.debit;
        cashOutflow += line.credit;
      }
    });
  });

  return { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, cashInflow, cashOutflow, tb };
}
