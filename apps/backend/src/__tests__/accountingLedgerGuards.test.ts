import { describe, expect, it } from 'vitest';
import type { FiscalYear, JournalEntry } from '@mms/shared';
import { prepareJournalEntryForPersist } from '../accounting/use-cases/accountingLedgerGuards.js';

const years: FiscalYear[] = [
  { id: 'fy-open', label: '2026-2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'active' },
  { id: 'fy-shut', label: '2025-2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'closed' },
];

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'je-1',
    date: '2026-08-01',
    ref: 'JE-0001',
    description: 'Fee receipt',
    status: 'posted',
    created_by: 'u1',
    fiscal_year: '2026-2027',
    lines: [
      { id: 'l1', account_id: 'a1', debit: 100, credit: 0, description: '' },
      { id: 'l2', account_id: 'a2', debit: 0, credit: 100, description: '' },
    ],
    tags: [],
    attachments: [],
    ...overrides,
  };
}

describe('prepareJournalEntryForPersist', () => {
  it('fills fiscal_year_id from the label and defaults source_type to manual', () => {
    const prepared = prepareJournalEntryForPersist(entry(), years);
    expect(prepared.fiscal_year_id).toBe('fy-open');
    expect(prepared.fiscal_year).toBe('2026-2027');
    expect(prepared.source_type).toBe('manual');
  });

  it('rejects posted unbalanced entries', () => {
    expect(() =>
      prepareJournalEntryForPersist(
        entry({
          lines: [{ id: 'l1', account_id: 'a1', debit: 100, credit: 0, description: '' }],
        }),
        years,
      ),
    ).toThrow(/matching debit and credit/);
  });

  it('allows unbalanced drafts', () => {
    const prepared = prepareJournalEntryForPersist(
      entry({
        status: 'draft',
        lines: [{ id: 'l1', account_id: 'a1', debit: 25, credit: 0, description: '' }],
      }),
      years,
    );
    expect(prepared.status).toBe('draft');
  });

  it('rejects writes against a closed fiscal year', () => {
    expect(() => prepareJournalEntryForPersist(entry({ fiscal_year: 'fy-shut' }), years)).toThrow(
      /closed fiscal year/,
    );
  });
});
