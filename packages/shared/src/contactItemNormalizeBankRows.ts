import {
  DEFAULT_BANK_LABELS,
  DEFAULT_BANK_CURRENCIES,
} from "./contactPreferenceConstants.js";
import type { ContactBankDetail } from "./contactEntityTypes.js";
import { BANK_DETAIL_SYSTEM_KEYS } from "./contactItemNormalizeKeys.js";
import {
  retainExtraKeys,
  type ContactItemNormalizeDefaults,
} from "./contactItemNormalizeRowsShared.js";

/**
 * Normalizes a single Bank Detail entry into a valid ContactBankDetail object.
 */
export function normalizeBankDetailItem(
  item: unknown,
  defaults: ContactItemNormalizeDefaults = {},
): ContactBankDetail {
  const defaultLabel = defaults.bankLabel || DEFAULT_BANK_LABELS[0] || "Primary";
  const defaultCurrency = defaults.bankCurrency || DEFAULT_BANK_CURRENCIES[0] || "PKR";

  if (!item || typeof item !== "object") {
    return {
      bankName: typeof item === "string" ? item.trim() : "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
      branchName: "",
      branchCode: "",
      routingNumber: "",
      currency: defaultCurrency,
      isPrimary: false,
      label: defaultLabel,
    };
  }

  const obj = item as Record<string, unknown>;
  const bankName = String(obj.bankName || obj.bank || "").trim();
  const accountTitle = String(obj.accountTitle || obj.title || "").trim();
  const accountNumber = String(obj.accountNumber || obj.accountNo || obj.value || "").trim();
  const iban = String(obj.iban || "").trim().toUpperCase();
  const swiftCode = String(obj.swiftCode || obj.swift || obj.bic || "").trim().toUpperCase();
  const branchName = String(obj.branchName || obj.branch || "").trim();
  const branchCode = String(obj.branchCode || "").trim();
  const routingNumber = String(obj.routingNumber || "").trim();
  const currency = String(obj.currency || defaultCurrency).trim().toUpperCase() || defaultCurrency;
  const isPrimary = typeof obj.isPrimary === "boolean" ? obj.isPrimary : false;
  const label = String(obj.label || obj.type || defaultLabel).trim() || defaultLabel;

  return {
    ...retainExtraKeys(obj, BANK_DETAIL_SYSTEM_KEYS),
    bankName,
    accountTitle,
    accountNumber,
    iban: iban || undefined,
    swiftCode: swiftCode || undefined,
    branchName: branchName || undefined,
    branchCode: branchCode || undefined,
    routingNumber: routingNumber || undefined,
    currency: currency || undefined,
    isPrimary,
    label,
  };
}
