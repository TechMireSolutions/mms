import { useMemo } from "react";
import { DEFAULT_CURRENCIES } from "@mms/shared";
import { useAccountingConfig } from "./useAccountingConfig";

/**
 * Custom hook to get active currency metadata and a settings-aware formatting function.
 */
export function useAccountingCurrency() {
  const { settings } = useAccountingConfig();

  const activeCurrency = useMemo(() => {
    return (
      DEFAULT_CURRENCIES.find((currency) => currency.code === settings.currency) ||
      DEFAULT_CURRENCIES[0] ||
      { symbol: "$", code: "USD", name: "US Dollar" }
    );
  }, [settings.currency]);

  const formatCurrency = useMemo(() => {
    return (amount: number | string | null | undefined): string => {
      if (amount === null || amount === undefined) return "—";
      const numeric = typeof amount === "number" ? amount : parseFloat(String(amount));
      if (isNaN(numeric)) return "—";
      return `${activeCurrency.symbol} ${numeric.toLocaleString(undefined, {
        minimumFractionDigits: settings.decimalPlaces,
        maximumFractionDigits: settings.decimalPlaces,
      })}`;
    };
  }, [activeCurrency.symbol, settings.decimalPlaces]);

  return {
    activeCurrency,
    formatCurrency,
    settings,
  };
}
