import { useCurrency } from "@/hooks/useCurrency";
import { useAccountingConfig } from "./useAccountingConfig";

/**
 * Custom hook to get active currency metadata and a settings-aware formatting function.
 */
export function useAccountingCurrency() {
  const { settings } = useAccountingConfig();

  const { activeCurrency, formatCurrency } = useCurrency({
    currencyCode: settings.currency,
    decimalPlaces: settings.decimalPlaces,
  });

  return {
    activeCurrency,
    formatCurrency,
    settings,
  };
}


