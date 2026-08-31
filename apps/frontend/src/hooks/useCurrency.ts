import { DEFAULT_CURRENCIES, formatMoney } from "@mms/shared";
import { useFinanceConfig, useAccountingConfig } from "./useStandardModuleConfig";

export interface UseCurrencyOptions {
  currencyCode?: string;
  decimalPlaces?: number;
}

export function useCurrency({ currencyCode, decimalPlaces }: UseCurrencyOptions = {}) {
  const activeCurrency = (() => {
    return (
      DEFAULT_CURRENCIES.find((c) => c.code === currencyCode) ||
      DEFAULT_CURRENCIES[0] ||
      { symbol: "$", code: "USD", name: "US Dollar" }
    );
  })();

  const formatCurrency = (() => {
    return (amount: number | string | null | undefined): string => {
      return formatMoney(amount, activeCurrency.code, {
        useSymbol: true,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    };
  })();

  return {
    activeCurrency,
    formatCurrency,
  };
}

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

/**
 * Custom hook to get active currency metadata and a settings-aware formatting function for accounting.
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

