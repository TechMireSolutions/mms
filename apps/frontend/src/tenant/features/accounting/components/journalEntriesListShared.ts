import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { ReactNode } from "react";
import type { AppTranslationKey } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { JournalEntry } from "@/lib/data/accountingData";

export interface JournalEntriesVisibleColumns {
  ref: boolean;
  date: boolean;
  description: boolean;
  tags: boolean;
  debit: boolean;
  credit: boolean;
  status: boolean;
}

export interface JournalEntriesListProps {
  viewMode: WorkDirectoryViewMode;
  entries: JournalEntry[];
  selectedIds: string[];
  canDelete: boolean;
  allFilteredSelected: boolean;
  visibleColumns: JournalEntriesVisibleColumns;
  journalStatusConfig: Record<string, StatusBadgeConfigItem>;
  grandDebit: number;
  grandCredit: number;
  formatAmount: (amount: number) => string;
  renderEntryActions: (entry: JournalEntry) => ReactNode;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function getJournalEntryLineTotals(entry: JournalEntry): { totalDebit: number; totalCredit: number } {
  const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
  return { totalDebit, totalCredit };
}

export function getVisibleLeadingColumnCount(visibleColumns: JournalEntriesVisibleColumns): number {
  return (
    (visibleColumns.ref ? 1 : 0) +
    (visibleColumns.date ? 1 : 0) +
    (visibleColumns.description ? 1 : 0) +
    (visibleColumns.tags ? 1 : 0)
  );
}

export function getJournalEntriesCountLabel(
  entryCount: number,
  t: TranslationFunction,
): string {
  return entryCount !== 1
    ? t("accounting.journal.dashboard.entriesCount", { count: entryCount })
    : t("accounting.journal.dashboard.entryCount", { count: entryCount });
}

export function isJournalBalanced(grandDebit: number, grandCredit: number): boolean {
  return Math.abs(grandDebit - grandCredit) < 0.01;
}

export function getJournalBalanceDifference(
  grandDebit: number,
  grandCredit: number,
  formatAmount: (amount: number) => string,
): string {
  return formatAmount(Math.abs(grandDebit - grandCredit));
}

export function getJournalTagLabel(tag: string, t: TranslationFunction): string {
  return t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey);
}
