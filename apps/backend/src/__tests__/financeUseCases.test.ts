import { describe, expect, it, vi } from 'vitest';
import { createFinanceUseCases } from '../finance/use-cases/financeUseCases.js';
import type { FinanceRepository } from '../finance/repository/financeRepository.js';
import { runWithTenant } from '../lib/tenantContext.js';

function createFakeRepo(): FinanceRepository {
  return {
    listInvoicesByWorkspace: vi.fn().mockResolvedValue([]),
    findInvoiceById: vi.fn().mockResolvedValue(null),
    saveInvoice: vi.fn().mockResolvedValue(undefined),
    listInvoicesPage: vi.fn().mockResolvedValue({
      invoices: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    bulkUpdateInvoicesStatus: vi.fn().mockResolvedValue({ succeeded: 2, failed: 0 }),
    listPaymentsByWorkspace: vi.fn().mockResolvedValue([]),
    findPaymentById: vi.fn().mockResolvedValue(null),
    savePayment: vi.fn().mockResolvedValue(undefined),
    listPaymentsPage: vi.fn().mockResolvedValue({
      payments: [],
      total: 0,
      page: 1,
      limit: 12,
      hasMore: false,
    }),
    aggregateFinanceCommandMetrics: vi.fn().mockResolvedValue({
      totalInvoices: 4,
      outstanding: 1,
      overdue: 0,
      paid: 2,
      partial: 1,
      totalPayments: 3,
      collectedTotal: 100,
      outstandingBalance: 50,
      discountTotal: 0,
      collectedThisMonth: 0,
      collectedPrevMonth: 0,
      outstandingThisMonth: 0,
      outstandingPrevMonth: 0,
    }),
    aggregateFinanceWidgetQueries: vi.fn().mockResolvedValue({}),
    loadFinanceReportAggregates: vi.fn().mockResolvedValue({
      comparison: { sessions: [], monthly: { a: [], b: [] } },
    }),
  };
}

describe('finance use-cases (DI with fake repository)', () => {
  it('loadInvoicesPage delegates to the injected repository with the active tenant', async () => {
    const repo = createFakeRepo();
    const useCases = createFinanceUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadInvoicesPage({ page: 2, limit: 12 }));

    expect(result).toEqual({ invoices: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listInvoicesPage).toHaveBeenCalledWith('demo', { page: 2, limit: 12 });
  });

  it('loadPaymentsPage delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createFinanceUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadPaymentsPage({ page: 1, limit: 12 }));

    expect(result).toEqual({ payments: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(repo.listPaymentsPage).toHaveBeenCalledWith('demo', { page: 1, limit: 12 });
  });

  it('bulkUpdateInvoicesStatus delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createFinanceUseCases(repo);

    const result = await runWithTenant('demo', () =>
      useCases.bulkUpdateInvoicesStatus(['inv-1', 'inv-2'], 'paid'),
    );

    expect(result).toEqual({ succeeded: 2, failed: 0 });
    expect(repo.bulkUpdateInvoicesStatus).toHaveBeenCalledWith('demo', ['inv-1', 'inv-2'], 'paid');
  });

  it('loadFinanceCommandMetrics delegates to the injected repository', async () => {
    const repo = createFakeRepo();
    const useCases = createFinanceUseCases(repo);

    const result = await runWithTenant('demo', () => useCases.loadFinanceCommandMetrics());

    expect(result.totalInvoices).toBe(4);
    expect(repo.aggregateFinanceCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('returns empty defaults when no tenant context is bound', async () => {
    const repo = createFakeRepo();
    const useCases = createFinanceUseCases(repo);

    const invoices = await useCases.loadInvoicesPage({ page: 1, limit: 12 });
    const metrics = await useCases.loadFinanceCommandMetrics();

    expect(invoices).toEqual({ invoices: [], total: 0, page: 1, limit: 12, hasMore: false });
    expect(metrics.totalInvoices).toBe(0);
    expect(repo.listInvoicesPage).not.toHaveBeenCalled();
    expect(repo.aggregateFinanceCommandMetrics).not.toHaveBeenCalled();
  });
});
