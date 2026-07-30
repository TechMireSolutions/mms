import { getInvoiceTemplateBranding } from "./invoiceTemplateBranding.js";
import { buildDefaultInvoiceTemplateElements } from "./invoiceTemplateElements.js";
import type { InvoiceTemplate } from "./invoiceTemplateTypes.js";

/**
 * Generates the default invoice template schema for A6 size canvas.
 */
export function getDefaultTemplate(): InvoiceTemplate {
  const b = getInvoiceTemplateBranding();
  return {
    pageSize: "A6",
    elements: buildDefaultInvoiceTemplateElements(b),
  };
}
