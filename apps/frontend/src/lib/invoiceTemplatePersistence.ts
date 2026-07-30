import { formatDate, formatMoney, INVOICE_TEMPLATE_OBJECT_KEY } from "@mms/shared";
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
  { field: "reference",        label: "Reference" },
  { field: "obligation_type",  label: "Obligation Type" },
  { field: "mujtahid",         label: "Mujtahid" },
  { field: "representative",   label: "Representative" },
  { field: "amount",           label: "Amount" },
  { field: "currency",         label: "Currency" },
  { field: "payment_mode",     label: "Payment Mode" },
  { field: "received_by",      label: "Received By" },
];

const findItem = (arr?: LookupItem[], id?: unknown): LookupItem | undefined => {
  return (arr || []).find((item) => String(item.id) === String(id));
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
    case "receipt_no":      return String(collection.receipt_no || "");
    case "received_date":   return collection.received_date ? formatDate(collection.received_date as string) : "";
    case "sender":          return String(findItem(contacts, collection.sender_id)?.name || "");
    case "reference":       return String(findItem(contacts, collection.reference_id)?.name || "");
    case "obligation_type": return String(findItem(obligationTypes, collection.obligation_type_id)?.name || "");
    case "mujtahid": {
      const rep = findItem(reps, collection.mujtahid_representative_id);
      return rep ? String(findItem(mujtahids, rep.mujtahid_id)?.name || "") : "";
    }
    case "representative":  return String(findItem(reps, collection.mujtahid_representative_id)?.name || "");
    case "amount": {
      const currency = findItem(currencies, collection.currency_id);
      return formatMoney(collection.amount as number | string | null | undefined, currency?.code || undefined);
    }
    case "currency":        return String(findItem(currencies, collection.currency_id)?.code || "");
    case "payment_mode":    return String(collection.payment_mode || "");
    case "received_by":     return String(findItem(users, collection.received_by)?.name || "");
    default:                return String(collection[field] || "");
  }
}
