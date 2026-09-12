import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import { formatBrandingAddress } from "@mms/shared";
import { getInvoiceTemplateBranding } from "./invoiceTemplateBranding.js";
import { buildDefaultInvoiceTemplateElements } from "./invoiceTemplateElements.js";
import type { BrandingInfo, InvoiceTemplate } from "./invoiceTemplateTypes.js";

export interface InvoiceTemplatePreset {
  key: string;
  nameKey: string;
  template: InvoiceTemplate;
}

/**
 * Builds the Classic A6 preset (MMS default).
 */
export function buildClassicPreset(b: BrandingInfo): InvoiceTemplate {
  return {
    pageSize: "A6",
    elements: buildDefaultInvoiceTemplateElements(b),
  };
}

/**
 * Builds the Thermal 80mm POS receipt preset.
 */
export function buildThermalPreset(b: BrandingInfo): InvoiceTemplate {
  const primary = b.primaryColor;
  const { text, border, label, muted } = PRINT_NEUTRAL;

  return {
    pageSize: "80mm",
    elements: [
      { id: "th_logo", type: "logo", label: "Logo", x: 121, y: 16, w: 60, h: 60, style: { objectFit: "contain" } },
      { id: "th_org_name", type: "static", label: b.madrasaName, x: 10, y: 82, w: 282, h: 20, style: { fontSize: 14, fontWeight: "bold", textAlign: "center", color: primary } },
      { id: "th_tagline", type: "static", label: b.tagline || "", x: 10, y: 104, w: 282, h: 14, style: { fontSize: 9, textAlign: "center", color: muted } },
      { id: "th_div1", type: "divider", label: "", x: 10, y: 122, w: 282, h: 1, style: { color: border } },
      { id: "th_rcpt_lbl", type: "static", label: "Receipt:", x: 10, y: 130, w: 70, h: 14, style: { fontSize: 9, fontWeight: "bold", color: label } },
      { id: "th_rcpt_val", type: "field", label: "Receipt No", field: "receipt_no", x: 85, y: 130, w: 205, h: 14, style: { fontSize: 9, fontWeight: "bold", color: primary, fontFamily: "monospace" } },
      { id: "th_date_lbl", type: "static", label: "Date:", x: 10, y: 148, w: 70, h: 14, style: { fontSize: 9, fontWeight: "bold", color: label } },
      { id: "th_date_val", type: "field", label: "Date", field: "received_date", x: 85, y: 148, w: 205, h: 14, style: { fontSize: 9, color: text } },
      { id: "th_div2", type: "divider", label: "", x: 10, y: 166, w: 282, h: 1, style: { color: border } },
      { id: "th_from_lbl", type: "static", label: "Donor:", x: 10, y: 174, w: 70, h: 14, style: { fontSize: 9, fontWeight: "bold", color: label } },
      { id: "th_from_val", type: "field", label: "Sender", field: "sender", x: 85, y: 174, w: 205, h: 14, style: { fontSize: 9, color: text } },
      { id: "th_type_lbl", type: "static", label: "Category:", x: 10, y: 194, w: 70, h: 14, style: { fontSize: 9, fontWeight: "bold", color: label } },
      { id: "th_type_val", type: "field", label: "Obligation Type", field: "obligation_type", x: 85, y: 194, w: 205, h: 14, style: { fontSize: 9, color: text } },
      { id: "th_mujtahid_lbl", type: "static", label: "Mujtahid:", x: 10, y: 214, w: 70, h: 14, style: { fontSize: 9, fontWeight: "bold", color: label } },
      { id: "th_mujtahid_val", type: "field", label: "Mujtahid", field: "mujtahid", x: 85, y: 214, w: 205, h: 14, style: { fontSize: 9, color: text } },
      { id: "th_div3", type: "divider", label: "", x: 10, y: 234, w: 282, h: 2, style: { color: border } },
      { id: "th_amt_lbl", type: "static", label: "TOTAL:", x: 10, y: 244, w: 70, h: 18, style: { fontSize: 12, fontWeight: "bold", color: label } },
      { id: "th_amt_val", type: "field", label: "Amount", field: "amount", x: 85, y: 242, w: 205, h: 22, style: { fontSize: 15, fontWeight: "bold", color: primary, fontFamily: "monospace" } },
      { id: "th_amt_words", type: "field", label: "Amount in Words", field: "amount_in_words", x: 10, y: 268, w: 282, h: 26, style: { fontSize: 8.5, fontStyle: "italic", color: muted } },
      { id: "th_div4", type: "divider", label: "", x: 10, y: 298, w: 282, h: 1, style: { color: border } },
      { id: "th_qr", type: "qrcode", label: "Verification QR", x: 116, y: 310, w: 70, h: 70 },
      { id: "th_qr_lbl", type: "static", label: "Scan to verify authentic receipt", x: 10, y: 386, w: 282, h: 12, style: { fontSize: 8, textAlign: "center", color: muted } },
      { id: "th_div5", type: "divider", label: "", x: 10, y: 404, w: 282, h: 1, style: { color: border } },
      { id: "th_bless", type: "static", label: "تقبل اللہ منکم", x: 10, y: 414, w: 282, h: 20, style: { fontSize: 14, fontWeight: "bold", textAlign: "center", color: primary, fontFamily: "serif", direction: "rtl" } },
      { id: "th_foot", type: "static", label: b.phone ? `Phone: ${b.phone}` : "", x: 10, y: 440, w: 282, h: 12, style: { fontSize: 8, textAlign: "center", color: muted } },
    ],
  };
}

/**
 * Builds the Formal A5 official certificate/letterhead preset.
 */
export function buildFormalA5Preset(b: BrandingInfo): InvoiceTemplate {
  const primary = b.primaryColor;
  const { text, border, label, muted } = PRINT_NEUTRAL;

  return {
    pageSize: "A5",
    elements: [
      { id: "fm_logo", type: "logo", label: "Logo", x: 30, y: 25, w: 70, h: 70, style: { objectFit: "contain" } },
      { id: "fm_org_name", type: "static", label: b.madrasaName, x: 115, y: 30, w: 414, h: 24, style: { fontSize: 18, fontWeight: "bold", color: primary } },
      { id: "fm_tagline", type: "static", label: b.tagline || "", x: 115, y: 56, w: 414, h: 16, style: { fontSize: 10, color: muted } },
      { id: "fm_address", type: "static", label: formatBrandingAddress(b), x: 115, y: 74, w: 414, h: 16, style: { fontSize: 9, color: muted } },
      { id: "fm_div1", type: "divider", label: "", x: 30, y: 106, w: 499, h: 2, style: { color: primary } },
      { id: "fm_title", type: "static", label: "OFFICIAL OBLIGATION RECEIPT / سند استلام الحقوق الشرعية", x: 30, y: 118, w: 499, h: 20, style: { fontSize: 11, fontWeight: "bold", textAlign: "center", color: label } },
      { id: "fm_rcpt_lbl", type: "static", label: "Receipt No:", x: 30, y: 148, w: 80, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_rcpt_val", type: "field", label: "Receipt No", field: "receipt_no", x: 115, y: 148, w: 140, h: 16, style: { fontSize: 10, fontWeight: "bold", color: primary, fontFamily: "monospace" } },
      { id: "fm_date_lbl", type: "static", label: "Date:", x: 320, y: 148, w: 60, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_date_val", type: "field", label: "Date", field: "received_date", x: 385, y: 148, w: 140, h: 16, style: { fontSize: 10, color: text } },
      { id: "fm_div2", type: "divider", label: "", x: 30, y: 172, w: 499, h: 1, style: { color: border } },
      { id: "fm_from_lbl", type: "static", label: "Received From:", x: 30, y: 182, w: 110, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_from_val", type: "field", label: "Sender", field: "sender", x: 145, y: 182, w: 200, h: 16, style: { fontSize: 10, color: text } },
      { id: "fm_phone_lbl", type: "static", label: "Phone:", x: 350, y: 182, w: 50, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_phone_val", type: "field", label: "Sender Phone", field: "sender_phone", x: 405, y: 182, w: 120, h: 16, style: { fontSize: 10, color: text } },
      { id: "fm_type_lbl", type: "static", label: "Obligation Type:", x: 30, y: 206, w: 110, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_type_val", type: "field", label: "Obligation Type", field: "obligation_type", x: 145, y: 206, w: 380, h: 16, style: { fontSize: 10, color: text } },
      { id: "fm_mujtahid_lbl", type: "static", label: "Under Authority of:", x: 30, y: 230, w: 110, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_mujtahid_val", type: "field", label: "Mujtahid", field: "mujtahid", x: 145, y: 230, w: 380, h: 16, style: { fontSize: 10, color: text } },
      { id: "fm_div3", type: "divider", label: "", x: 30, y: 258, w: 499, h: 2, style: { color: border } },
      { id: "fm_amt_lbl", type: "static", label: "Amount Received:", x: 30, y: 272, w: 120, h: 22, style: { fontSize: 12, fontWeight: "bold", color: label } },
      { id: "fm_amt_val", type: "field", label: "Amount", field: "amount", x: 155, y: 270, w: 200, h: 24, style: { fontSize: 16, fontWeight: "bold", color: primary, fontFamily: "monospace" } },
      { id: "fm_words_lbl", type: "static", label: "In Words:", x: 30, y: 302, w: 70, h: 16, style: { fontSize: 10, fontWeight: "bold", color: label } },
      { id: "fm_words_val", type: "field", label: "Amount in Words", field: "amount_in_words", x: 105, y: 302, w: 420, h: 20, style: { fontSize: 10, fontStyle: "italic", color: text } },
      { id: "fm_div4", type: "divider", label: "", x: 30, y: 334, w: 499, h: 1, style: { color: border } },
      { id: "fm_qr", type: "qrcode", label: "Verification QR", x: 40, y: 360, w: 75, h: 75 },
      { id: "fm_sign_box", type: "static", label: "Authorized Signatory / ختم وتوقيع المسؤول", x: 310, y: 410, w: 210, h: 18, style: { fontSize: 9, textAlign: "center", color: muted } },
      { id: "fm_sign_line", type: "divider", label: "", x: 310, y: 404, w: 210, h: 1, style: { color: border } },
      { id: "fm_bless", type: "static", label: "تقبل اللہ منکم صالح الاعمال", x: 30, y: 460, w: 499, h: 24, style: { fontSize: 16, fontWeight: "bold", textAlign: "center", color: primary, fontFamily: "serif", direction: "rtl" } },
    ],
  };
}

/**
 * Builds the Modern Minimalist A6 preset.
 */
export function buildModernPreset(b: BrandingInfo): InvoiceTemplate {
  const primary = b.primaryColor;
  const { text, border, label, muted } = PRINT_NEUTRAL;

  return {
    pageSize: "A6",
    elements: [
      { id: "md_bar", type: "divider", label: "", x: 0, y: 0, w: 397, h: 6, style: { color: primary } },
      { id: "md_logo", type: "logo", label: "Logo", x: 20, y: 20, w: 50, h: 50, style: { objectFit: "contain" } },
      { id: "md_org_name", type: "static", label: b.madrasaName, x: 80, y: 24, w: 297, h: 20, style: { fontSize: 14, fontWeight: "bold", color: text } },
      { id: "md_rcpt_badge", type: "field", label: "Receipt No", field: "receipt_no", x: 80, y: 46, w: 180, h: 16, style: { fontSize: 10, fontWeight: "bold", color: primary, fontFamily: "monospace" } },
      { id: "md_date_val", type: "field", label: "Date", field: "received_date", x: 270, y: 46, w: 107, h: 16, style: { fontSize: 10, textAlign: "right", color: muted } },
      { id: "md_div1", type: "divider", label: "", x: 20, y: 80, w: 357, h: 1, style: { color: border } },
      { id: "md_from_lbl", type: "static", label: "DONOR", x: 20, y: 92, w: 100, h: 12, style: { fontSize: 8, fontWeight: "bold", color: label } },
      { id: "md_from_val", type: "field", label: "Sender", field: "sender", x: 20, y: 106, w: 357, h: 16, style: { fontSize: 11, fontWeight: "bold", color: text } },
      { id: "md_type_lbl", type: "static", label: "OBLIGATION TYPE", x: 20, y: 130, w: 140, h: 12, style: { fontSize: 8, fontWeight: "bold", color: label } },
      { id: "md_type_val", type: "field", label: "Obligation Type", field: "obligation_type", x: 20, y: 144, w: 357, h: 16, style: { fontSize: 10, color: text } },
      { id: "md_div2", type: "divider", label: "", x: 20, y: 172, w: 357, h: 2, style: { color: primary } },
      { id: "md_amt_lbl", type: "static", label: "AMOUNT RECEIVED", x: 20, y: 186, w: 140, h: 14, style: { fontSize: 9, fontWeight: "bold", color: primary } },
      { id: "md_amt_val", type: "field", label: "Amount", field: "amount", x: 20, y: 202, w: 357, h: 24, style: { fontSize: 16, fontWeight: "800", color: primary, fontFamily: "monospace" } },
      { id: "md_words", type: "field", label: "Amount in Words", field: "amount_in_words", x: 20, y: 230, w: 357, h: 20, style: { fontSize: 9, fontStyle: "italic", color: muted } },
      { id: "md_div3", type: "divider", label: "", x: 20, y: 260, w: 357, h: 1, style: { color: border } },
      { id: "md_qr", type: "qrcode", label: "Verification QR", x: 20, y: 280, w: 60, h: 60 },
      { id: "md_recv_lbl", type: "static", label: "Received By", x: 95, y: 284, w: 90, h: 12, style: { fontSize: 8, fontWeight: "bold", color: label } },
      { id: "md_recv_val", type: "field", label: "Received By", field: "received_by", x: 95, y: 298, w: 200, h: 14, style: { fontSize: 9, color: text } },
      { id: "md_bless", type: "static", label: "تقبل اللہ منکم", x: 20, y: 360, w: 357, h: 20, style: { fontSize: 14, fontWeight: "bold", textAlign: "center", color: primary, fontFamily: "serif", direction: "rtl" } },
    ],
  };
}

/**
 * Returns available template presets for obligations receipts.
 */
export function getAvailablePresets(): InvoiceTemplatePreset[] {
  const b = getInvoiceTemplateBranding();
  return [
    { key: "classic_a6", nameKey: "obligations.invoiceTemplate.presetClassic", template: buildClassicPreset(b) },
    { key: "thermal_80mm", nameKey: "obligations.invoiceTemplate.presetThermal", template: buildThermalPreset(b) },
    { key: "formal_a5", nameKey: "obligations.invoiceTemplate.presetFormal", template: buildFormalA5Preset(b) },
    { key: "modern_a6", nameKey: "obligations.invoiceTemplate.presetModern", template: buildModernPreset(b) },
  ];
}
