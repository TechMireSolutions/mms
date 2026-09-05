import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockAccountingRepo = vi.hoisted(() => ({
  bulkSaveEntries: vi.fn(),
  findEntryById: vi.fn(),
  findEntryIdBySource: vi.fn(),
  saveEntry: vi.fn(),
}));

const mockLedgerOpsRepo = vi.hoisted(() => ({
  getPostingRules: vi.fn(),
}));

const mockFiscalYearsRepo = vi.hoisted(() => ({
  listFiscalYearsByWorkspace: vi.fn(),
}));

const mockGuards = vi.hoisted(() => ({
  prepareJournalEntryForPersist: vi.fn((entry) => entry),
}));

vi.mock('../db/repositories/accountingRepository.js', () => mockAccountingRepo);
vi.mock('../db/repositories/accountingLedgerOpsRepository.js', () => mockLedgerOpsRepo);
vi.mock('../db/repositories/accountingFiscalYearsRepository.js', () => mockFiscalYearsRepo);
vi.mock('../accounting/use-cases/accountingLedgerGuards.js', () => mockGuards);

import {
  tryPostInvoiceJournal,
  tryPostPaymentJournal,
  tryPostOpeningJournal,
  tryPostInvoiceReversalJournal,
  tryPostLateFeeJournals,
  tryPostCreditNoteJournal,
} from '../accounting/ledgerPosting/ledgerPostingService.js';

describe('ledgerPostingService', () => {
  const fiscalYears = [
    { id: 'fy-1', label: '2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFiscalYearsRepo.listFiscalYearsByWorkspace.mockResolvedValue(fiscalYears);
    mockAccountingRepo.findEntryIdBySource.mockResolvedValue(null);
  });

  it('tryPostInvoiceJournal posts Dr AR / Cr Income when accounts configured', async () => {
    mockLedgerOpsRepo.getPostingRules.mockResolvedValue({
      arAccountId: 'acc-ar',
      incomeAccountId: 'acc-inc',
    });
    mockAccountingRepo.saveEntry.mockResolvedValue(undefined);

    const invoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0001',
      status: 'pending',
      dueDate: '2026-06-01',
      finalAmt: 500,
      discountAmt: 0,
    } as any;

    await tryPostInvoiceJournal('tenant-1', invoice);

    expect(mockAccountingRepo.saveEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        ref: 'invoice:inv-1',
        source_type: 'invoice',
        source_id: 'inv-1',
      }),
    );
  });

  it('tryPostInvoiceJournal skips cancelled invoices', async () => {
    const invoice = { id: 'inv-1', status: 'cancelled', finalAmt: 100 } as any;
    await tryPostInvoiceJournal('tenant-1', invoice);
    expect(mockAccountingRepo.saveEntry).not.toHaveBeenCalled();
  });

  it('tryPostPaymentJournal posts Dr Cash / Cr AR', async () => {
    mockLedgerOpsRepo.getPostingRules.mockResolvedValue({
      cashAccountId: 'acc-cash',
      arAccountId: 'acc-ar',
    });
    mockAccountingRepo.saveEntry.mockResolvedValue(undefined);

    const payment = {
      id: 'pmt-1',
      date: '2026-06-05',
      amount: 500,
      note: 'Payment for invoice',
    } as any;

    await tryPostPaymentJournal('tenant-1', payment);

    expect(mockAccountingRepo.saveEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        ref: 'payment:pmt-1',
        source_type: 'payment',
        source_id: 'pmt-1',
      }),
    );
  });

  it('tryPostOpeningJournal validates balanced opening entries', async () => {
    const balances = [
      { id: 'ob-1', accountId: 'acc-cash', debit: 1000, credit: 0 },
      { id: 'ob-2', accountId: 'acc-cap', debit: 0, credit: 1000 },
    ] as any;

    await tryPostOpeningJournal('tenant-1', 'fy-1', balances);

    expect(mockAccountingRepo.saveEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        source_type: 'opening',
        source_id: 'fy-1',
      }),
    );
  });

  it('tryPostOpeningJournal throws 404 for unknown fiscal year', async () => {
    await expect(tryPostOpeningJournal('tenant-1', 'fy-unknown', [])).rejects.toThrow(/Fiscal year not found/);
  });

  it('tryPostInvoiceReversalJournal reverses original lines', async () => {
    mockAccountingRepo.findEntryIdBySource.mockImplementation(async (_t, sourceType) =>
      sourceType === 'invoice' ? 'je-orig' : null,
    );
    mockAccountingRepo.findEntryById.mockResolvedValue({
      id: 'je-orig',
      lines: [
        { id: 'l1', accountId: 'acc-ar', debit: 100, credit: 0 },
        { id: 'l2', accountId: 'acc-inc', debit: 0, credit: 100 },
      ],
    });

    const invoice = { id: 'inv-1', invoiceNumber: 'INV-1' } as any;
    await tryPostInvoiceReversalJournal('tenant-1', invoice);

    expect(mockAccountingRepo.saveEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        source_type: 'reversal',
        source_id: 'inv-1',
      }),
    );
  });

  it('tryPostLateFeeJournals bulk saves late fee entries', async () => {
    mockLedgerOpsRepo.getPostingRules.mockResolvedValue({
      arAccountId: 'acc-ar',
      incomeAccountId: 'acc-inc',
    });
    mockAccountingRepo.bulkSaveEntries.mockResolvedValue(undefined);

    const fees = [
      { invoice: { id: 'inv-1', invoiceNumber: 'INV-1' } as any, amount: 25 },
    ];

    await tryPostLateFeeJournals('tenant-1', fees);

    expect(mockAccountingRepo.bulkSaveEntries).toHaveBeenCalledWith(
      'tenant-1',
      expect.arrayContaining([
        expect.objectContaining({
          source_type: 'invoice',
          source_id: 'latefee:inv-1',
        }),
      ]),
    );
  });

  it('tryPostCreditNoteJournal posts credit note journal', async () => {
    mockLedgerOpsRepo.getPostingRules.mockResolvedValue({
      incomeAccountId: 'acc-inc',
      arAccountId: 'acc-ar',
    });
    mockAccountingRepo.saveEntry.mockResolvedValue(undefined);

    const invoice = { id: 'inv-1', invoiceNumber: 'INV-1' } as any;
    await tryPostCreditNoteJournal('tenant-1', invoice, 'cn-1', 50);

    expect(mockAccountingRepo.saveEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        source_type: 'reversal',
        source_id: 'cn-1',
      }),
    );
  });
});
