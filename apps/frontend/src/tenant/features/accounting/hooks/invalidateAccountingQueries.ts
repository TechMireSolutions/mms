import type { QueryClient } from '@tanstack/react-query';
import {
  ACCOUNTING_ACCOUNTS_QUERY_KEY,
  ACCOUNTING_ENTRIES_QUERY_KEY,
  ACCOUNTING_FISCAL_YEARS_QUERY_KEY,
  ACCOUNTING_METRICS_QUERY_KEY,
} from '@/tenant/features/accounting/hooks/useAccountingApi';

/** Invalidate Accounting accounts/entries/fiscal-years/metrics Query keys (mutations + live push). */
export function invalidateAccountingQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ACCOUNTS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ACCOUNTING_ENTRIES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ACCOUNTING_FISCAL_YEARS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ACCOUNTING_METRICS_QUERY_KEY });
}
