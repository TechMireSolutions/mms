import type { FinanceRepository } from './financeRepository.js';
import {
  listInvoicesByWorkspace,
  findInvoiceById,
  saveInvoice,
  listPaymentsByWorkspace,
  findPaymentById,
  savePayment,
} from '../../db/repositories/financeRepository.js';
import {
  listInvoicesPage,
  listPaymentsPage,
  aggregateFinanceCommandMetrics,
  bulkUpdateInvoicesStatusSql,
} from '../../db/repositories/financeRepositoryList.js';
import { loadFinanceReportAggregatesSql } from '../../db/repositories/financeRepositoryReport.js';
import { aggregateFinanceWidgetQueries } from '../../db/repositories/financeRepositoryWidgets.js';

/**
 * Drizzle-backed adapter for {@link FinanceRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const financeRepository: FinanceRepository = {
  listInvoicesByWorkspace,
  findInvoiceById,
  saveInvoice,
  listInvoicesPage,
  bulkUpdateInvoicesStatus: bulkUpdateInvoicesStatusSql,
  listPaymentsByWorkspace,
  findPaymentById,
  savePayment,
  listPaymentsPage,
  aggregateFinanceCommandMetrics,
  aggregateFinanceWidgetQueries,
  loadFinanceReportAggregates: loadFinanceReportAggregatesSql,
};
