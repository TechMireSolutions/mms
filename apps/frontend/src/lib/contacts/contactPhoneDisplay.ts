import {
  formatPhoneWithCountryCode,
  parsePhoneNumber,
  getPrimaryPhone,
  type Contact,
  type ContactPreferences,
} from "@mms/shared";

/** Standardized phone display formatter for contacts tables and cards. */
export function formatContactPhoneDisplay(
  rawNumber: string | undefined | null,
  countryCodeFallback = "",
): { countryCode: string; formattedNumber: string } {
  if (!rawNumber) return { countryCode: countryCodeFallback, formattedNumber: "" };
  const fullPhone = formatPhoneWithCountryCode(rawNumber, countryCodeFallback);
  if (!fullPhone) return { countryCode: countryCodeFallback, formattedNumber: "" };
  const parsed = parsePhoneNumber(fullPhone, countryCodeFallback);
  return { countryCode: parsed.countryCode || countryCodeFallback, formattedNumber: parsed.number || rawNumber };
}

/** Formats tel: link href for telephone actions. */
export function formatTelHref(phoneStr: string | undefined | null): string {
  if (!phoneStr) return "#";
  const formatted = formatPhoneWithCountryCode(phoneStr);
  const p = parsePhoneNumber(formatted || phoneStr);
  const num = `${p.countryCode}${p.number.replace(/\s+/g, "")}`;
  return `tel:${num || phoneStr}`;
}

/** Resolves fallback country code from prefs → mapped code → first configured code (no hardcoded dial). */
export function getFallbackCountryCode(
  prefs?: Partial<ContactPreferences>,
  countryCodesMap?: Record<string, string>,
  countryCodes?: Array<{ country: string; code: string }>,
): string {
  const defaultCountry = prefs?.defaultCountry;
  if (defaultCountry && countryCodesMap?.[defaultCountry]) {
    return countryCodesMap[defaultCountry];
  }
  const firstConfigured = countryCodes?.find((entry) => entry.code)?.code;
  if (firstConfigured) return firstConfigured;
  const firstMapped = countryCodesMap && Object.values(countryCodesMap).find(Boolean);
  return firstMapped || "";
}

/** Resolves primary phone, country code, and formatted display for a contact. */
export function resolveContactPhoneDisplay(
  contact: Contact,
  prefs?: Partial<ContactPreferences>,
  countryCodesMap?: Record<string, string>,
  countryCodes?: Array<{ country: string; code: string }>,
): { phone: string | null; countryCode: string; phoneDisplay: string } {
  const defaultCountryCode = getFallbackCountryCode(prefs, countryCodesMap, countryCodes);
  const primaryPhone = getPrimaryPhone(contact, defaultCountryCode);
  const firstPhoneObj = (contact.phones || []).find((p) => (p.number || "").trim().length > 0) || contact.phones?.[0];
  const { countryCode, formattedNumber: phoneDisplay } = formatContactPhoneDisplay(
    primaryPhone || firstPhoneObj?.number,
    firstPhoneObj?.countryCode || defaultCountryCode,
  );
  return {
    phone: primaryPhone,
    countryCode,
    phoneDisplay,
  };
}
