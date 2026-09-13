import { formatAmountInWords, formatDate, formatMoney, INVOICE_TEMPLATE_OBJECT_KEY, type TemplateFieldDefinition } from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import { getDefaultTemplate } from "./invoiceTemplateDefaults.js";
import type {
  FieldLookupInfo,
  InvoiceTemplate,
  LookupItem,
  IndexedFieldLookups,
  InvoiceTemplateFieldKey,
  InvoiceReceiptPayload,
} from "./invoiceTemplateTypes.js";

export type { IndexedFieldLookups, InvoiceTemplateFieldKey };

const STORAGE_KEY = INVOICE_TEMPLATE_OBJECT_KEY;

export const INVOICE_TEMPLATE_CHANGED_EVENT = "mms:invoice-template-changed";

/**
 * Loads the current invoice template configuration from local cache.
 * Falls back to default template if cached object is missing or corrupted.
 *
 * @returns {InvoiceTemplate} The loaded template config.
 */
export function loadTemplate(): InvoiceTemplate {
  const fallback = getDefaultTemplate();
  const loaded = getObject<InvoiceTemplate>(STORAGE_KEY, fallback);
  if (
    !loaded ||
    typeof loaded !== "object" ||
    typeof loaded.pageSize !== "string" ||
    !Array.isArray(loaded.elements)
  ) {
    return fallback;
  }
  return loaded;
}

/**
 * Saves/updates the current invoice template config after verifying structural validity.
 * Dispatches an update event for reactive subscribers.
 *
 * @param {InvoiceTemplate} tmpl - The template config to save.
 * @returns {void}
 */
export function saveTemplate(tmpl: InvoiceTemplate): void {
  if (
    !tmpl ||
    typeof tmpl !== "object" ||
    typeof tmpl.pageSize !== "string" ||
    !Array.isArray(tmpl.elements)
  ) {
    throw new TypeError("Cannot save invalid invoice template: missing pageSize or elements array.");
  }
  saveObject(STORAGE_KEY, tmpl);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INVOICE_TEMPLATE_CHANGED_EVENT, { detail: tmpl }));
  }
}

/**
 * Resets local invoice template back to system defaults.
 *
 * @returns {InvoiceTemplate} The restored default template config.
 */
export function resetTemplate(): InvoiceTemplate {
  const defaultTmpl = getDefaultTemplate();
  saveTemplate(defaultTmpl);
  return defaultTmpl;
}

export const AVAILABLE_FIELDS: TemplateFieldDefinition<InvoiceReceiptPayload>[] = [
  { field: "receipt_no",           label: "Receipt No",           category: "Receipt",             sampleValue: "REC-2026-0042" },
  { field: "received_date",        label: "Date",                 category: "Receipt",             sampleValue: "2026-09-13" },
  { field: "received_by",          label: "Received By",          category: "Receipt",             sampleValue: "Admin Office" },
  { field: "sender",               label: "Received From",        category: "Donor & Reference",   sampleValue: "Muhammad Ali Raza" },
  { field: "sender_phone",         label: "Sender Phone",         category: "Donor & Reference",   sampleValue: "+92 300 1234567" },
  { field: "sender_email",         label: "Sender Email",         category: "Donor & Reference",   sampleValue: "ali.raza@example.com" },
  { field: "reference",            label: "Reference",            category: "Donor & Reference",   sampleValue: "Sayyid Kazim Hosseini" },
  { field: "reference_phone",      label: "Reference Phone",      category: "Donor & Reference",   sampleValue: "+92 321 9876543" },
  { field: "reference_email",      label: "Reference Email",      category: "Donor & Reference",   sampleValue: "kazim.ref@example.com" },
  { field: "obligation_type",      label: "Obligation Type",      category: "Religious Authority", sampleValue: "Khums (Sahm-e-Imam)" },
  { field: "mujtahid",             label: "Mujtahid",             category: "Religious Authority", sampleValue: "Ayatullah al-Uzma Sistani" },
  { field: "representative",       label: "Representative",       category: "Religious Authority", sampleValue: "Maulana Baqir Zaidi" },
  { field: "amount",               label: "Amount",               category: "Financial",           sampleValue: "PKR 75,000.00" },
  { field: "amount_in_words",      label: "Amount in Words",      category: "Financial",           sampleValue: "Seventy Five Thousand Rupees Only" },
  { field: "currency",             label: "Currency",             category: "Financial",           sampleValue: "PKR" },
  { field: "payment_mode",         label: "Payment Mode",         category: "Financial",           sampleValue: "Bank Transfer" },
  { field: "institution_name",     label: "Institution Name",     category: "Institution",         sampleValue: "Madrasa Al-Huda" },
  { field: "institution_phone",    label: "Institution Phone",    category: "Institution",         sampleValue: "+92 21 34567890" },
  { field: "institution_email",    label: "Institution Email",    category: "Institution",         sampleValue: "office@alhuda.edu" },
  { field: "institution_address",  label: "Institution Address",  category: "Institution",         sampleValue: "123 Seminary Road, Karachi" },
];

/**
 * Pre-indexes lookup collections into $O(1)$ maps for high-performance template rendering.
 */
export function indexLookups(lookups?: FieldLookupInfo): IndexedFieldLookups {
  const indexArr = (arr?: LookupItem[]): Map<string, LookupItem> => {
    const map = new Map<string, LookupItem>();
    if (!arr) return map;
    for (const item of arr) {
      if (item.id != null) {
        const key = String(item.id).trim().toLowerCase();
        if (key) map.set(key, item);
      }
      if (item.code) {
        const codeKey = String(item.code).trim().toLowerCase();
        if (codeKey) map.set(codeKey, item);
      }
    }
    return map;
  };

  return {
    contacts: indexArr(lookups?.contacts),
    users: indexArr(lookups?.users),
    obligationTypes: indexArr(lookups?.obligationTypes),
    mujtahids: indexArr(lookups?.mujtahids),
    reps: indexArr(lookups?.reps),
    currencies: indexArr(lookups?.currencies),
    branding: lookups?.branding,
  };
}

const findItem = (
  source?: LookupItem[] | Map<string, LookupItem>,
  id?: unknown
): LookupItem | undefined => {
  if (!source || id == null) return undefined;
  const target = String(id).trim().toLowerCase();
  if (!target) return undefined;

  if (source instanceof Map) {
    return source.get(target);
  }

  // Fast-path primitive equality before allocating lowercased strings
  return source.find(
    (item) =>
      item.id === id ||
      item.code === id ||
      (item.id != null && String(item.id).trim().toLowerCase() === target) ||
      (item.code != null && String(item.code).trim().toLowerCase() === target)
  );
};

const resolveCurrencyCode = (
  currencies?: LookupItem[] | Map<string, LookupItem>,
  currencyId?: unknown
): string => {
  if (currencyId == null) return "PKR";
  const found = findItem(currencies, currencyId);
  if (found?.code && typeof found.code === "string") return found.code.trim().toUpperCase();
  const raw = String(currencyId).trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(raw)) return raw;
  return "PKR";
};

/**
 * Resolves a dynamic field's string value using database records and lookup mappings.
 *
 * @param {InvoiceTemplateFieldKey | string} field - The field identifier.
 * @param {Record<string, unknown> | null} [collection] - The primary collection record.
 * @param {FieldLookupInfo | IndexedFieldLookups} [lookups] - Helper lookup maps or indexed maps.
 * @returns {string} The resolved string value.
 */
export function resolveField(
  field: InvoiceTemplateFieldKey | string,
  collection?: Record<string, unknown> | null,
  lookups?: FieldLookupInfo | IndexedFieldLookups
): string {
  if (!collection) return "";
  const { contacts, users, obligationTypes, mujtahids, reps, currencies, branding } = lookups || {};

  switch (field) {
    case "receipt_no":           return String(collection.receipt_no || "");
    case "received_date":        return collection.received_date ? formatDate(collection.received_date as string) : "";
    case "sender":               return String(findItem(contacts, collection.sender_id)?.name || collection.sender_id || "");
    case "sender_phone":         return String(findItem(contacts, collection.sender_id)?.phone || "");
    case "sender_email":         return String(findItem(contacts, collection.sender_id)?.email || "");
    case "reference":            return String(findItem(contacts, collection.reference_id)?.name || collection.reference_id || "");
    case "reference_phone":      return String(findItem(contacts, collection.reference_id)?.phone || "");
    case "reference_email":      return String(findItem(contacts, collection.reference_id)?.email || "");
    case "obligation_type":      return String(findItem(obligationTypes, collection.obligation_type_id)?.name || collection.obligation_type_id || "");
    case "mujtahid": {
      const rep = findItem(reps, collection.mujtahid_representative_id);
      return rep ? String(findItem(mujtahids, rep.mujtahid_id)?.name || "") : "";
    }
    case "representative":       return String(findItem(reps, collection.mujtahid_representative_id)?.name || "");
    case "amount": {
      if (collection.amount == null || collection.amount === "") return "";
      const num = Number(collection.amount);
      if (!Number.isFinite(num)) return "";
      const currencyCode = resolveCurrencyCode(currencies, collection.currency_id);
      return formatMoney(num, currencyCode);
    }
    case "amount_in_words": {
      if (collection.amount == null || collection.amount === "") return "";
      const num = Number(collection.amount);
      if (!Number.isFinite(num)) return "";
      const currencyCode = resolveCurrencyCode(currencies, collection.currency_id);
      return formatAmountInWords(num, currencyCode);
    }
    case "currency":             return resolveCurrencyCode(currencies, collection.currency_id);
    case "payment_mode":         return String(collection.payment_mode || "");
    case "received_by":          return String(findItem(users, collection.received_by)?.name || collection.received_by || "");
    case "institution_name":
      return String(branding?.madrasaName || collection.institution_name || collection.institution || "");
    case "institution_phone":
      return String(branding?.phone || collection.institution_phone || "");
    case "institution_email":
      return String(branding?.email || collection.institution_email || "");
    case "institution_address": {
      const addressParts = [branding?.addressLine1, branding?.addressLine2, branding?.city].filter(Boolean);
      if (addressParts.length > 0) {
        return addressParts.join(", ");
      }
      return String(collection.institution_address || "");
    }
    default: {
      if (collection[field] != null && collection[field] !== "") {
        return String(collection[field]);
      }
      let customData = collection.custom_data;
      if (typeof customData === "string") {
        try {
          customData = JSON.parse(customData);
        } catch {
          // Ignore JSON parse error
        }
      }
      if (customData && typeof customData === "object" && field in customData) {
        const val = (customData as Record<string, unknown>)[field];
        return val != null ? String(val) : "";
      }
      return "";
    }
  }
}


