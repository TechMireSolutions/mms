import { useCurrency } from "@/hooks/useCurrency";
import { useFinanceConfig } from "./useFinanceConfig";

/**
 * Custom hook to get active currency metadata and a settings-aware formatting function for finance.
 */
export function useFinanceCurrency() {
  const { settings } = useFinanceConfig();

  const { activeCurrency, formatCurrency } = useCurrency({
    currencyCode: settings.currency,
  });

  return {
    activeCurrency,
    formatCurrency,
    settings,
  };
}

