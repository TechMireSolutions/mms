import { useMemo } from "react";
import { DEFAULT_CURRENCIES, formatMoney } from "@mms/shared";
import { useFinanceConfig } from "./useFinanceConfig";

/**
 * Custom hook to get active currency metadata and a settings-aware formatting function for finance.
 */
export function useFinanceCurrency() {
  const { settings } = useFinanceConfig();

  const activeCurrency = useMemo(() => {
    return (
      DEFAULT_CURRENCIES.find((currency) => currency.code === settings.currency) ||
      DEFAULT_CURRENCIES[0] ||
      { symbol: "$", code: "USD", name: "US Dollar" }
    );
  }, [settings.currency]);

  const formatCurrency = useMemo(() => {
    return (amount: number | string | null | undefined): string => {
      return formatMoney(amount, activeCurrency.code);
    };
  }, [activeCurrency.code]);

  return {
    activeCurrency,
    formatCurrency,
    settings,
  };
}
