import {
  ACCOUNTING_ACCOUNT_TYPES,
  ACCOUNT_SUBTYPES,
  type Account,
  type JournalLine,
  type JournalEntry,
  type FiscalYear,
  type AccountingSettings,
  DEFAULT_ACCOUNTING_SETTINGS as DEFAULT_SETTINGS,
  todayISO,
} from "@mms/shared";
import {
  computeLedger,
  computeTrialBalance,
  computeFinancials,
} from "./accountingCalculations";

export const ACCOUNT_TYPES = ACCOUNTING_ACCOUNT_TYPES;
export type AccountType = typeof ACCOUNT_TYPES[number];
export { ACCOUNT_SUBTYPES };

export const ACCOUNT_TYPE_META = {
  Asset:     { normalBalance: "debit",  color: "bg-info/15 text-info border-info/30",       group: "balance" as const, icon: "🏦" },
  Liability: { normalBalance: "credit", color: "bg-destructive/15 text-destructive border-destructive/30", group: "balance" as const, icon: "💳" },
  Equity:    { normalBalance: "credit", color: "bg-primary/15 text-primary border-primary/30", group: "balance" as const, icon: "📊" },
  Revenue:   { normalBalance: "credit", color: "bg-success/15 text-success border-success/30", group: "income" as const,  icon: "💰" },
  Expense:   { normalBalance: "debit",  color: "bg-warning/15 text-warning border-warning/30", group: "income" as const,  icon: "📉" },
};

export type { Account, JournalLine, JournalEntry, FiscalYear, AccountingSettings };
export { DEFAULT_SETTINGS, computeLedger, computeTrialBalance, computeFinancials };

/**
 * Convert integer cents back to a money number for display/export.
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
 */
export const JOURNAL_TAGS = ["Payroll", "Fees", "Donation", "Obligation", "Utilities", "Rent", "Capital", "Expense", "Adjustment", "Reversal", "Opening"];

/**
 * Build the correcting entry for `entry`.
 */
export function createReversalEntry(
  entry: JournalEntry,
  allEntries: JournalEntry[],
  date: string = todayISO(),
): JournalEntry {
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
    date,
    ref: nextRef,
    description: `Reversal of Entry ${entry.ref}: ${entry.description}`,
    status: "posted",
    source_type: "reversal",
    created_by: "System",
    tags: ["Reversal"],
    attachments: [],
    fiscal_year: "",
    fiscal_year_id: undefined,
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

export function isJournalRefUnique(
  ref: string,
  entries: readonly JournalEntry[],
  currentId?: string,
): boolean {
  const clean = ref?.trim();
  if (!clean) return true;
  return !entries.some(
    (e) => !e.deletedAt && e.ref?.trim().toLowerCase() === clean.toLowerCase() && (!currentId || e.id !== currentId),
  );
}
