import { describe, expect, it } from 'vitest';
import { moneyToCents } from '@mms/shared';
import {
  centsToMoney,
  computeFinancials,
  computeLedger,
  computeTrialBalance,
  createReversalEntry,
  hasReversalEntry,
  type Account,
  type JournalEntry,
} from './accountingData';

const accounts: Account[] = [
  { id: 'a-cash', code: '1000', name: 'Cash in Hand', type: 'Asset', subtype: 'Current Asset', description: '', isActive: true },
  { id: 'a-income', code: '4000', name: 'Tuition Income', type: 'Revenue', subtype: 'Operating Revenue', description: '', isActive: true },
  { id: 'a-expense', code: '5000', name: 'Wages', type: 'Expense', subtype: 'Operating Expense', description: '', isActive: true },
];

const balancedEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'je-1',
  ref: 'JE-0001',
  date: '2026-09-01',
  description: 'Fee collection',
  status: 'posted',
  created_by: 'u1',
  fiscal_year: '2026',
  fiscal_year_id: 'fy-2026',
  tags: [],
  attachments: [],
  lines: [
    { id: 'l1', account_id: 'a-cash', debit: 0.1, credit: 0, description: '' },
    { id: 'l2', account_id: 'a-cash', debit: 0.2, credit: 0, description: '' },
    { id: 'l3', account_id: 'a-income', debit: 0, credit: 0.3, description: '' },
  ],
  ...overrides,
});

describe('computeLedger', () => {
  it('returns cent-exact line money so a running balance never drifts', () => {
    const lines = computeLedger('a-cash', [balancedEntry()]);
    expect(lines).toHaveLength(2);
    expect(lines.map((ledgerLine) => ledgerLine.debit)).toEqual([0.1, 0.2]);
    // Accumulated through integer cents — what the ledger view does for its
    // running balance — the total is exactly 0.3, never 0.30000000000000004.
    const runningCents = lines.reduce((cents, ledgerLine) => cents + moneyToCents(ledgerLine.debit), 0);
    expect(String(centsToMoney(runningCents))).toBe('0.3');
  });

  it('ignores draft entries', () => {
    expect(computeLedger('a-cash', [balancedEntry({ status: 'draft' })])).toHaveLength(0);
  });
});

describe('computeTrialBalance', () => {
  it('aggregates in integer cents', () => {
    const rows = computeTrialBalance(accounts, [balancedEntry()]);
    const cash = rows.find((row) => row.id === 'a-cash');
    const income = rows.find((row) => row.id === 'a-income');
    expect(cash?.totalDebit).toBe(0.3);
    expect(cash?.balance).toBe(0.3);
    expect(income?.totalCredit).toBe(0.3);
    // Revenue is credit-normal: balance = -(debit - credit).
    expect(income?.balance).toBe(0.3);
  });

  it('stays exactly balanced across an entry whose lines are float-hostile', () => {
    const rows = computeTrialBalance(accounts, [balancedEntry()]);
    const debitTotal = rows.reduce((sum, row) => sum + Math.round(row.totalDebit * 100), 0);
    const creditTotal = rows.reduce((sum, row) => sum + Math.round(row.totalCredit * 100), 0);
    expect(debitTotal).toBe(creditTotal);
  });
});

describe('computeFinancials', () => {
  it('reports cent-exact money figures', () => {
    const financials = computeFinancials(accounts, [balancedEntry()]);
    expect(financials.revenue).toBe(0.3);
    expect(financials.assets).toBe(0.3);
    expect(financials.cashInflow).toBe(0.3);
    expect(financials.cashOutflow).toBe(0);
  });
});

describe('createReversalEntry', () => {
  it('creates a posted reversal so ledger views actually change', () => {
    const original = balancedEntry();
    const reversal = createReversalEntry(original, [original]);
    expect(reversal.status).toBe('posted');
    expect(reversal.source_type).toBe('reversal');
    expect(reversal.reversed_ref).toBe('JE-0001');
    expect(reversal.ref).toBe('REV-JE-0001-1');
    expect(reversal.fiscal_year_id).toBe('fy-2026');
    // Swapped lines are balanced by construction, so the posted write is legal.
    expect(reversal.lines.map((line) => [line.debit, line.credit])).toEqual([
      [0, 0.1],
      [0, 0.2],
      [0.3, 0],
    ]);
  });
});

describe('hasReversalEntry', () => {
  it('detects an existing reversal of the same reference', () => {
    const original = balancedEntry();
    const reversal = createReversalEntry(original, [original]);
    expect(hasReversalEntry(original, [original])).toBe(false);
    expect(hasReversalEntry(original, [original, reversal])).toBe(true);
    // A reversal is not "already reversed" by itself.
    expect(hasReversalEntry(reversal, [original, reversal])).toBe(false);
  });
});
