import type { JournalEntry } from '@/lib/data/accountingData';
import { getJournalEntryLineTotals } from '@/tenant/features/accounting/components/journalEntriesListShared';

export interface JournalEntryFilterState {
  search: string;
  statusFilter: string;
  tagFilter: string;
  dateFrom: string;
  dateTo: string;
}

export function filterJournalEntries(
  entries: JournalEntry[],
  filters: JournalEntryFilterState,
): JournalEntry[] {
  const { search, statusFilter, tagFilter, dateFrom, dateTo } = filters;
  return entries
    .filter((journalEntry) => statusFilter === 'all' || journalEntry.status === statusFilter)
    .filter((journalEntry) => tagFilter === 'all' || (journalEntry.tags || []).includes(tagFilter))
    .filter((journalEntry) => !dateFrom || journalEntry.date >= dateFrom)
    .filter((journalEntry) => !dateTo || journalEntry.date <= dateTo)
    .filter(
      (journalEntry) =>
        !search ||
        journalEntry.description.toLowerCase().includes(search.toLowerCase()) ||
        journalEntry.ref.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date));
}

export function computeJournalGrandTotals(filtered: JournalEntry[]): { grandDebit: number; grandCredit: number } {
  let grandDebit = 0;
  let grandCredit = 0;
  for (const journalEntry of filtered) {
    const { totalDebit, totalCredit } = getJournalEntryLineTotals(journalEntry);
    grandDebit += totalDebit;
    grandCredit += totalCredit;
  }
  return { grandDebit, grandCredit };
}

export interface JournalVisibleColumns {
  showRef: boolean;
  showDate: boolean;
  showDescription: boolean;
  showTags: boolean;
  showDebit: boolean;
  showCredit: boolean;
  showStatus: boolean;
}

export function resolveJournalVisibleColumns(
  isColumnVisible?: (key: string) => boolean,
): JournalVisibleColumns {
  const visible = (key: string) => (isColumnVisible ? isColumnVisible(key) : true);
  return {
    showRef: visible('ref'),
    showDate: visible('date'),
    showDescription: visible('description'),
    showTags: visible('tags'),
    showDebit: visible('debit'),
    showCredit: visible('credit'),
    showStatus: visible('status'),
  };
}
