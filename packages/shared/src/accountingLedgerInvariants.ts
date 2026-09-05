/** How a journal entry was created — used for idempotent finance posting. */
export const JOURNAL_SOURCE_TYPES = [
  'manual',
  'invoice',
  'payment',
  'closing',
  'reversal',
  'opening',
] as const;

export type JournalSourceType = (typeof JOURNAL_SOURCE_TYPES)[number];

export function isJournalSourceType(value: string): value is JournalSourceType {
  return (JOURNAL_SOURCE_TYPES as readonly string[]).includes(value);
}

export interface JournalLineAmounts {
  debit: number;
  credit: number;
}

export interface FiscalYearRef {
  id: string;
  label: string;
  status: string;
}

/** Convert a money number to integer cents for exact debit/credit compares. */
export function moneyToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * A journal line is single-sided when at most one of debit/credit is positive
 * and neither is negative.
 */
export function isJournalLineSingleSided(line: JournalLineAmounts): boolean {
  const debitCents = moneyToCents(line.debit);
  const creditCents = moneyToCents(line.credit);
  return debitCents >= 0 && creditCents >= 0 && (debitCents === 0 || creditCents === 0);
}

/**
 * Posted (and any explicitly checked) entries must have at least two lines,
 * each single-sided, and matching debit/credit totals.
 */
export function isJournalEntryBalanced(lines: readonly JournalLineAmounts[]): boolean {
  if (lines.length < 2) return false;
  let debitCents = 0;
  let creditCents = 0;
  for (const line of lines) {
    if (!isJournalLineSingleSided(line)) return false;
    debitCents += moneyToCents(line.debit);
    creditCents += moneyToCents(line.credit);
  }
  return debitCents === creditCents && debitCents > 0;
}

/**
 * Resolve a fiscal year by id or display label (legacy `fiscal_year` varchar).
 */
export function resolveFiscalYearRef(
  years: readonly FiscalYearRef[],
  ref: string | undefined | null,
): FiscalYearRef | null {
  const needle = ref?.trim() ?? '';
  if (!needle) return null;
  return years.find((year) => year.id === needle || year.label === needle) ?? null;
}

export function isFiscalYearClosed(year: FiscalYearRef | null | undefined): boolean {
  return year?.status === 'closed';
}
