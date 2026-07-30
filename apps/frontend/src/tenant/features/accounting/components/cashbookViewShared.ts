import type { AppTranslationKey } from "@mms/shared";
import type { JournalEntry } from "@/lib/data/accountingData";

export const MONEY_IN_CREDITS = ["a4000", "a4100", "a4200", "a4300", "a4400"];
export const MONEY_OUT_DEBITS = ["a5000", "a5100", "a5200", "a5300", "a5400", "a5500", "a5600", "a5700", "a5800"];

export type EntryType = "in" | "out" | "transfer";

export interface CashbookRow extends JournalEntry {
  flowType: EntryType;
  flowAmount: number;
  flowLabel: string;
}

export function classifyEntry(entry: JournalEntry & { transaction_type?: string }): EntryType {
  if (entry.transaction_type) {
    const transactionType = entry.transaction_type;
    if (["fee_collection", "donation", "rent_income", "other_income"].includes(transactionType)) return "in";
    if (["salary", "utilities", "supplies", "rent_payment", "other_expense"].includes(transactionType)) return "out";
    return "transfer";
  }
  const hasRevenueCredit = entry.lines.some((journalLine) => MONEY_IN_CREDITS.includes(journalLine.account_id) && journalLine.credit > 0);
  const hasExpenseDebit = entry.lines.some((journalLine) => MONEY_OUT_DEBITS.includes(journalLine.account_id) && journalLine.debit > 0);
  if (hasRevenueCredit) return "in";
  if (hasExpenseDebit) return "out";
  return "transfer";
}

export function getEntryAmount(entry: JournalEntry, type: EntryType): number {
  if (type === "in") {
    const revenueLines = entry.lines.filter((journalLine) => MONEY_IN_CREDITS.includes(journalLine.account_id) && journalLine.credit > 0);
    if (revenueLines.length > 0) return revenueLines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
    return entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
  }
  if (type === "out") {
    const expenseLines = entry.lines.filter((journalLine) => MONEY_OUT_DEBITS.includes(journalLine.account_id) && journalLine.debit > 0);
    if (expenseLines.length > 0) return expenseLines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
    return entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  }
  return entry.lines.reduce((largestDebit, journalLine) => Math.max(largestDebit, journalLine.debit), 0);
}

export function getEntryLabel(
  entry: JournalEntry & { transaction_type?: string },
  t: (key: AppTranslationKey) => string,
): string {
  if (entry.transaction_type) {
    const translationKey = `accounting.transaction.type.${entry.transaction_type}` as AppTranslationKey;
    const translatedValue = t(translationKey);
    return translatedValue && translatedValue !== translationKey ? translatedValue : entry.transaction_type;
  }
  const tags = entry.tags || [];
  if (tags.length > 0) return tags[0];
  return t("accounting.transaction.type.transaction");
}

export function buildCashbookRows(
  entries: JournalEntry[],
  search: string,
  filterType: EntryType | "all",
  t: (key: AppTranslationKey) => string,
): CashbookRow[] {
  return entries
    .filter((journalEntry) => journalEntry.status === "posted")
    .map((journalEntry) => {
      const flowType = classifyEntry(journalEntry);
      return {
        ...journalEntry,
        flowType,
        flowAmount: getEntryAmount(journalEntry, flowType),
        flowLabel: getEntryLabel(journalEntry, t),
      };
    })
    .filter((cashbookRow) => filterType === "all" || cashbookRow.flowType === filterType)
    .filter((cashbookRow) => !search || cashbookRow.description.toLowerCase().includes(search.toLowerCase()) || cashbookRow.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((firstRow, secondRow) => secondRow.date.localeCompare(firstRow.date));
}
