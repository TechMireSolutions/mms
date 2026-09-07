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
  _defaults: ContactItemNormalizeDefaults = {},
): ContactBankDetail {
  if (!item || typeof item !== "object") {
    return {
      bankName: typeof item === "string" ? item.trim() : "",
      accountType: "",
      accountNumber: "",
    };
  }

  const obj = item as Record<string, unknown>;
  const bankName = String(obj.bankName || obj.bank || "").trim();
  const accountType = String(obj.accountType || obj.label || obj.type || "").trim();
  const accountNumber = String(
    obj.accountNumber || obj.accountNo || obj.iban || obj.value || "",
  ).trim();

  return {
    ...retainExtraKeys(obj, BANK_DETAIL_SYSTEM_KEYS),
    bankName: bankName || undefined,
    accountType: accountType || undefined,
    accountNumber: accountNumber || undefined,
  };
}
