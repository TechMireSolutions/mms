import type {
  Invoice,
  Payment,
  FinanceListQuery,
  FinanceInvoicesListPageResult,
  FinancePaymentsListPageResult,
  FinanceCommandMetricsSnapshot,
  FinanceReportAggregates,
  FinanceReportComparisonQuery,
  WidgetQuery,
  WidgetAggregateResult,
} from '@mms/shared';

/**
 * Sole storage gateway for the finance module (invoices + payments).
 *
 * Mirrors the `contacts`/`sessions`/`enrollments` reference pattern: routes and
 * use-cases depend on this interface (never on Drizzle directly), and the
 * Drizzle-backed adapter is the only implementation. Tests can inject a fake
 * repository at the seam.
 */
export interface FinanceRepository {
  // Invoices
  listInvoicesByWorkspace(tenant: string): Promise<Invoice[]>;
  findInvoiceById(tenant: string, id: string): Promise<Invoice | null>;
  saveInvoice(tenant: string, record: Invoice): Promise<void>;
  listInvoicesPage(tenant: string, query: FinanceListQuery): Promise<FinanceInvoicesListPageResult>;
  bulkUpdateInvoicesStatus(
    tenant: string,
    ids: string[],
    status: string,
  ): Promise<{ succeeded: number; failed: number }>;

  // Payments
  listPaymentsByWorkspace(tenant: string): Promise<Payment[]>;
  findPaymentById(tenant: string, id: string): Promise<Payment | null>;
  savePayment(tenant: string, record: Payment): Promise<void>;
  listPaymentsPage(tenant: string, query: FinanceListQuery): Promise<FinancePaymentsListPageResult>;

  // Aggregates
  aggregateFinanceCommandMetrics(tenant: string): Promise<FinanceCommandMetricsSnapshot>;
  aggregateFinanceWidgetQueries(
    tenant: string,
    queries: WidgetQuery[],
  ): Promise<Record<string, WidgetAggregateResult>>;
  loadFinanceReportAggregates(
    tenant: string,
    comparisonQuery?: FinanceReportComparisonQuery,
  ): Promise<FinanceReportAggregates>;
}
