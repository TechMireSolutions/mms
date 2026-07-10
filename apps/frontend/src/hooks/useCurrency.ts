import { useMemo } from "react";
import { DEFAULT_CURRENCIES, formatMoney } from "@mms/shared";

export interface UseCurrencyOptions {
  currencyCode?: string;
  decimalPlaces?: number;
}

export function useCurrency({ currencyCode, decimalPlaces }: UseCurrencyOptions = {}) {
  const activeCurrency = useMemo(() => {
    return (
      DEFAULT_CURRENCIES.find((c) => c.code === currencyCode) ||
      DEFAULT_CURRENCIES[0] ||
      { symbol: "$", code: "USD", name: "US Dollar" }
    );
  }, [currencyCode]);

  const formatCurrency = useMemo(() => {
    return (amount: number | string | null | undefined): string => {
      return formatMoney(amount, activeCurrency.code, {
        useSymbol: true,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    };
  }, [activeCurrency.code, decimalPlaces]);

  return {
    activeCurrency,
    formatCurrency,
  };
}
