import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { ReactNode } from "react";
import type { AppTranslationKey } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { JournalEntry } from "@/lib/data/accountingData";

export const JOURNAL_LEADING_COLUMN_KEYS = ["ref", "date", "description", "tags"] as const;

export interface JournalEntriesListProps {
  viewMode: WorkDirectoryViewMode;
  entries: JournalEntry[];
  selectedIds: string[];
  canDelete: boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  isColumnVisible: (key: string) => boolean;
  journalStatusConfig: Record<string, StatusBadgeConfigItem>;
  grandDebit: number;
  grandCredit: number;
  formatAmount: (amount: number) => string;
  /** Table row-actions renderer (shared overflow trigger). */
  renderEntryActions: (entry: JournalEntry) => ReactNode;
  /** Cards row-actions renderer (directory-card overflow trigger). */
  renderEntryActionsCards: (entry: JournalEntry) => ReactNode;
  onView: (entry: JournalEntry) => void;
  onToggleSelectedEntry: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function getJournalEntryLineTotals(entry: JournalEntry): { totalDebit: number; totalCredit: number } {
  const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);
  return { totalDebit, totalCredit };
}

export function getVisibleLeadingColumnCount(isColumnVisible: (key: string) => boolean): number {
  return JOURNAL_LEADING_COLUMN_KEYS.filter(isColumnVisible).length;
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
