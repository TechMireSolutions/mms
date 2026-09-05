import {
  isFiscalYearClosed,
  isJournalEntryBalanced,
  resolveFiscalYearRef,
  type FiscalYear,
  type JournalEntry,
} from '@mms/shared';

export type AccountingLedgerHttpError = Error & {
  statusCode: number;
  type: 'validation_error';
};

function ledgerError(message: string): AccountingLedgerHttpError {
  const error = new Error(message) as AccountingLedgerHttpError;
  error.statusCode = 422;
  error.type = 'validation_error';
  return error;
}

/**
 * Resolve fiscal-year FK from id or legacy label and reject closed-period /
 * unbalanced posted writes. Drafts may be unbalanced.
 */
export function prepareJournalEntryForPersist(
  entry: JournalEntry,
  fiscalYears: readonly FiscalYear[],
): JournalEntry {
  const resolved = resolveFiscalYearRef(
    fiscalYears,
    entry.fiscal_year_id ?? entry.fiscal_year,
  );

  if (isFiscalYearClosed(resolved)) {
    throw ledgerError('Cannot mutate journal entries in a closed fiscal year');
  }

  if (entry.status === 'posted' && !isJournalEntryBalanced(entry.lines ?? [])) {
    throw ledgerError('Posted journal entries must have matching debit and credit totals');
  }

  return {
    ...entry,
    fiscal_year_id: resolved?.id ?? entry.fiscal_year_id,
    fiscal_year: resolved?.label ?? entry.fiscal_year,
    source_type: entry.source_type ?? 'manual',
  };
}
