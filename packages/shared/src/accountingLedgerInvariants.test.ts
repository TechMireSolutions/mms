import { describe, expect, it } from 'vitest';
import {
  isFiscalYearClosed,
  isJournalEntryBalanced,
  isJournalLineSingleSided,
  isJournalSourceType,
  moneyToCents,
  resolveFiscalYearRef,
} from './accountingLedgerInvariants.js';

describe('accountingLedgerInvariants', () => {
  it('rounds money to cents without float drift', () => {
    expect(moneyToCents(10.1 + 10.2)).toBe(2030);
    expect(moneyToCents(0.1 + 0.2)).toBe(30);
  });

  it('requires a single-sided journal line', () => {
    expect(isJournalLineSingleSided({ debit: 10, credit: 0 })).toBe(true);
    expect(isJournalLineSingleSided({ debit: 0, credit: 10 })).toBe(true);
    expect(isJournalLineSingleSided({ debit: 0, credit: 0 })).toBe(true);
    expect(isJournalLineSingleSided({ debit: 5, credit: 5 })).toBe(false);
    expect(isJournalLineSingleSided({ debit: -1, credit: 0 })).toBe(false);
  });

  it('accepts a balanced two-line entry and rejects posted-style imbalance', () => {
    expect(
      isJournalEntryBalanced([
        { debit: 150.5, credit: 0 },
        { debit: 0, credit: 150.5 },
      ]),
    ).toBe(true);
    expect(
      isJournalEntryBalanced([
        { debit: 100, credit: 0 },
        { debit: 0, credit: 99.99 },
      ]),
    ).toBe(false);
    expect(isJournalEntryBalanced([{ debit: 50, credit: 0 }])).toBe(false);
    expect(
      isJournalEntryBalanced([
        { debit: 0, credit: 0 },
        { debit: 0, credit: 0 },
      ]),
    ).toBe(false);
  });

  it('resolves fiscal years by id or label and detects closed status', () => {
    const years = [
      { id: 'fy-1', label: '2026-2027', status: 'active' },
      { id: 'fy-0', label: '2025-2026', status: 'closed' },
    ];
    expect(resolveFiscalYearRef(years, 'fy-1')?.label).toBe('2026-2027');
    expect(resolveFiscalYearRef(years, '2025-2026')?.id).toBe('fy-0');
    expect(resolveFiscalYearRef(years, '  ')).toBeNull();
    expect(isFiscalYearClosed(resolveFiscalYearRef(years, 'fy-0'))).toBe(true);
    expect(isFiscalYearClosed(resolveFiscalYearRef(years, 'fy-1'))).toBe(false);
  });

  it('narrows journal source types', () => {
    expect(isJournalSourceType('payment')).toBe(true);
    expect(isJournalSourceType('wire')).toBe(false);
  });
});
