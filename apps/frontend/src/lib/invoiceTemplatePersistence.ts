import { formatAmountInWords, formatDate, formatMoney, INVOICE_TEMPLATE_OBJECT_KEY } from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import { getDefaultTemplate } from "./invoiceTemplateDefaults.js";
import type { FieldLookupInfo, InvoiceTemplate, LookupItem } from "./invoiceTemplateTypes.js";

const STORAGE_KEY = INVOICE_TEMPLATE_OBJECT_KEY;

/**
 * Loads the current invoice template configuration from local cache.
 *
 * @returns {InvoiceTemplate} The loaded template config.
 */
export function loadTemplate(): InvoiceTemplate {
  return getObject<InvoiceTemplate>(STORAGE_KEY, getDefaultTemplate());
}

/**
 * Saves/updates the current invoice template config.
 *
 * @param {InvoiceTemplate} tmpl - The template config to save.
 * @returns {void}
 */
export function saveTemplate(tmpl: InvoiceTemplate): void {
  saveObject(STORAGE_KEY, tmpl);
}

export const AVAILABLE_FIELDS = [
  { field: "receipt_no",       label: "Receipt No" },
  { field: "received_date",    label: "Date" },
  { field: "sender",           label: "Received From" },
  { field: "sender_phone",     label: "Sender Phone" },
  { field: "sender_email",     label: "Sender Email" },
  { field: "reference",        label: "Reference" },
  { field: "reference_phone",  label: "Reference Phone" },
  { field: "reference_email",  label: "Reference Email" },
  { field: "obligation_type",  label: "Obligation Type" },
  { field: "mujtahid",         label: "Mujtahid" },
  { field: "representative",   label: "Representative" },
  { field: "amount",           label: "Amount" },
  { field: "amount_in_words",  label: "Amount in Words" },
  { field: "currency",         label: "Currency" },
  { field: "payment_mode",     label: "Payment Mode" },
  { field: "received_by",      label: "Received By" },
];

const findItem = (arr?: LookupItem[], id?: unknown): LookupItem | undefined => {
  if (!arr || id == null) return undefined;
  const target = String(id).trim().toLowerCase();
  return arr.find(
    (item) =>
      String(item.id).trim().toLowerCase() === target ||
      (item.code && String(item.code).trim().toLowerCase() === target)
  );
};

/**
 * Resolves a dynamic field's string value using database records and lookup mappings.
 *
 * @param {string} field - The field identifier.
 * @param {Record<string, unknown>} collection - The primary collection record.
 * @param {FieldLookupInfo} [lookups] - Helper lookup maps.
 * @returns {string} The resolved string value.
 */
export function resolveField(
  field: string,
  collection: Record<string, unknown> | null,
  lookups?: FieldLookupInfo
): string {
  if (!collection) return "";
  const { contacts, users, obligationTypes, mujtahids, reps, currencies } = lookups || {};

  switch (field) {
    case "receipt_no":       return String(collection.receipt_no || "");
    case "received_date":    return collection.received_date ? formatDate(collection.received_date as string) : "";
    case "sender":           return String(findItem(contacts, collection.sender_id)?.name || collection.sender_id || "");
    case "sender_phone":     return String(findItem(contacts, collection.sender_id)?.phone || "");
    case "sender_email":     return String(findItem(contacts, collection.sender_id)?.email || "");
    case "reference":        return String(findItem(contacts, collection.reference_id)?.name || collection.reference_id || "");
    case "reference_phone":  return String(findItem(contacts, collection.reference_id)?.phone || "");
    case "reference_email":  return String(findItem(contacts, collection.reference_id)?.email || "");
    case "obligation_type":  return String(findItem(obligationTypes, collection.obligation_type_id)?.name || collection.obligation_type_id || "");
    case "mujtahid": {
      const rep = findItem(reps, collection.mujtahid_representative_id);
      return rep ? String(findItem(mujtahids, rep.mujtahid_id)?.name || "") : "";
    }
    case "representative":   return String(findItem(reps, collection.mujtahid_representative_id)?.name || "");
    case "amount": {
      const currency = findItem(currencies, collection.currency_id);
      return formatMoney(collection.amount as number | string | null | undefined, currency?.code || String(collection.currency_id || "PKR"));
    }
    case "amount_in_words": {
      const currency = findItem(currencies, collection.currency_id);
      return formatAmountInWords(collection.amount as number | string | null | undefined, currency?.code || String(collection.currency_id || "PKR"));
    }
    case "currency":         return String(findItem(currencies, collection.currency_id)?.code || collection.currency_id || "");
    case "payment_mode":     return String(collection.payment_mode || "");
    case "received_by":      return String(findItem(users, collection.received_by)?.name || collection.received_by || "");
    default:                 return String(collection[field] || "");
  }
}

