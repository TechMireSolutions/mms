/**
 * Currency list and locale-aware money/number formatting.
 */

export const DEFAULT_CURRENCIES = [
  { id: "cur1", code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { id: "cur2", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "cur3", code: "GBP", name: "British Pound", symbol: "£" },
  { id: "cur4", code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { id: "cur5", code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { id: "cur6", code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { id: "cur7", code: "EUR", name: "Euro", symbol: "€" }
];

/**
 * Retrieves the stored finance currency from localStorage if available (client-safe).
 */
export function getStoredFinanceCurrency(): string {
  if (typeof window !== "undefined") {
    try {
      let saved = localStorage.getItem("mms_finance_settings");
      if (!saved) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.endsWith(":finance_settings")) {
            saved = localStorage.getItem(key);
            break;
          }
        }
      }
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings?.currency) {
          return settings.currency;
        }
      }
    } catch {
      // Ignored
    }
  }
  return "PKR";
}

/**
 * Formats a numeric amount as currency (defaults to settings-aware currency or PKR).
 * @param amount - The numeric or string amount to format.
 * @param currency - The currency symbol/code (defaults to settings-aware currency).
 * @param options - Custom format options (e.g. useSymbol, excludeCurrency, decimal places).
 * @returns The formatted currency string, or "—" if invalid.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency?: string,
  options?: {
    useSymbol?: boolean;
    excludeCurrency?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount === null || amount === undefined) return "—";
  const numeric = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (isNaN(numeric)) return "—";

  const resolvedCurrency = currency || getStoredFinanceCurrency();

  const minDigits = options?.minimumFractionDigits ?? 0;
  const maxDigits = options?.maximumFractionDigits ?? 2;

  const formattedNum = numeric.toLocaleString(undefined, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  if (options?.excludeCurrency) {
    return formattedNum;
  }

  let prefix = resolvedCurrency;
  if (options?.useSymbol) {
    const found = DEFAULT_CURRENCIES.find((c) => c.code === resolvedCurrency || c.symbol === resolvedCurrency);
    if (found) {
      prefix = found.symbol;
    }
  }

  return `${prefix} ${formattedNum}`;
}

/**
 * Formats a numeric value or count string safely using locale settings.
 * @param value - The numeric or string value to format.
 * @param options - Custom Intl.NumberFormatOptions options.
 * @returns The formatted string, or "0" if null/undefined/NaN.
 */
export function formatNumber(
  value: number | string | readonly (string | number)[] | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return "0";
  if (Array.isArray(value)) {
    return value.map((v) => formatNumber(v, options)).join(", ");
  }
  const numeric = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numeric)) return "0";
  return numeric.toLocaleString(undefined, options);
}
