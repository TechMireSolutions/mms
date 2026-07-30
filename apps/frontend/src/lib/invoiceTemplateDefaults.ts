import { DEFAULT_BRANDING_SETTINGS, formatBrandingAddress, mergeBrandingSettings } from "@mms/shared";
import { getObject } from "@/lib/db";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { BrandingInfo, InvoiceTemplate } from "./invoiceTemplateTypes.js";

/**
 * Retrieves the institution's branding settings, falling back to defaults if not found.
 *
 * @returns {BrandingInfo} The branding settings object.
 */
function getBranding(): BrandingInfo {
  const b = getObject<BrandingInfo | null>("branding", null);
  if (b) return mergeBrandingSettings(b);
  try {
    const raw = localStorage.getItem("madrasa_branding");
    if (raw) {
      const parsed = JSON.parse(raw) as BrandingInfo;
      localStorage.setItem("mms_branding", raw);
      try {
        localStorage.removeItem("madrasa_branding");
      } catch {
        // Ignore removal error
      }
      return mergeBrandingSettings(parsed);
    }
  } catch {
    // Ignore read error
  }
  return DEFAULT_BRANDING_SETTINGS;
}

/**
 * Generates the default invoice template schema for A6 size canvas.
 *
 * @returns {InvoiceTemplate} The default template object.
 */
export function getDefaultTemplate(): InvoiceTemplate {
  const b = getBranding();
  const primary = b.primaryColor;
  const { text, muted, border, label, labelLight } = PRINT_NEUTRAL;
  return {
    pageSize: "A6",
    elements: [
      // Logo
      {
        id: "logo",
        type: "logo",
        label: "Logo",
        x: 159, y: 18, w: 80, h: 80,
        style: { objectFit: "contain" },
      },
      // Org name
      {
        id: "org_name",
        type: "static",
        label: b.madrasaName,
        x: 20, y: 104, w: 357, h: 24,
        style: { fontSize: 16, fontWeight: "bold", textAlign: "center", color: primary },
      },
      // Tagline
      {
        id: "org_tagline",
        type: "static",
        label: b.tagline,
        x: 20, y: 130, w: 357, h: 16,
        style: { fontSize: 10, textAlign: "center", color: muted },
      },
      // Divider 1
      {
        id: "divider1",
        type: "divider",
        label: "",
        x: 20, y: 152, w: 357, h: 2,
        style: { color: border },
      },
      // Receipt No label
      {
        id: "receipt_label",
        type: "static",
        label: "Receipt No:",
        x: 20, y: 162, w: 80, h: 16,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Receipt No value
      {
        id: "receipt_no",
        type: "field",
        label: "Receipt No",
        field: "receipt_no",
        x: 100, y: 162, w: 110, h: 16,
        style: { fontSize: 10, fontWeight: "700", color: primary, fontFamily: "monospace" },
      },
      // Date label
      {
        id: "date_label",
        type: "static",
        label: "Date:",
        x: 230, y: 162, w: 40, h: 16,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Date value
      {
        id: "date_value",
        type: "field",
        label: "Date",
        field: "received_date",
        x: 270, y: 162, w: 107, h: 16,
        style: { fontSize: 10, color: text },
      },
      // Divider 2
      {
        id: "divider2",
        type: "divider",
        label: "",
        x: 20, y: 184, w: 357, h: 1,
        style: { color: border },
      },
      // Received From label
      {
        id: "from_label",
        type: "static",
        label: "Received From:",
        x: 20, y: 192, w: 110, h: 14,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Received From value
      {
        id: "from_value",
        type: "field",
        label: "Sender",
        field: "sender",
        x: 130, y: 192, w: 247, h: 14,
        style: { fontSize: 10, color: text },
      },
      // Divider 3
      {
        id: "divider3",
        type: "divider",
        label: "",
        x: 20, y: 212, w: 357, h: 1,
        style: { color: border },
      },
      // Reference label
      {
        id: "ref_label",
        type: "static",
        label: "Reference:",
        x: 20, y: 220, w: 90, h: 14,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Reference value
      {
        id: "ref_value",
        type: "field",
        label: "Reference",
        field: "reference",
        x: 110, y: 220, w: 267, h: 14,
        style: { fontSize: 10, color: text },
      },
      // Divider 4
      {
        id: "divider4",
        type: "divider",
        label: "",
        x: 20, y: 240, w: 357, h: 1,
        style: { color: border },
      },
      // In Account Of label
      {
        id: "account_label",
        type: "static",
        label: "In Account Of:",
        x: 20, y: 248, w: 110, h: 14,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Obligation type value
      {
        id: "account_value",
        type: "field",
        label: "Obligation Type",
        field: "obligation_type",
        x: 130, y: 248, w: 247, h: 14,
        style: { fontSize: 10, color: text },
      },
      // Mujtahid label
      {
        id: "mujtahid_label",
        type: "static",
        label: "Mujtahid:",
        x: 20, y: 268, w: 80, h: 14,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Mujtahid value
      {
        id: "mujtahid_value",
        type: "field",
        label: "Mujtahid",
        field: "mujtahid",
        x: 100, y: 268, w: 277, h: 14,
        style: { fontSize: 10, color: text },
      },
      // Divider 5
      {
        id: "divider5",
        type: "divider",
        label: "",
        x: 20, y: 290, w: 357, h: 2,
        style: { color: border },
      },
      // Amount label
      {
        id: "amount_label",
        type: "static",
        label: "Amount:",
        x: 20, y: 300, w: 60, h: 18,
        style: { fontSize: 11, fontWeight: "bold", color: label },
      },
      // Amount value
      {
        id: "amount_value",
        type: "field",
        label: "Amount",
        field: "amount",
        x: 80, y: 298, w: 130, h: 20,
        style: { fontSize: 13, fontWeight: "800", color: primary, fontFamily: "monospace" },
      },
      // Received By label
      {
        id: "recv_label",
        type: "static",
        label: "Received By:",
        x: 222, y: 300, w: 90, h: 16,
        style: { fontSize: 10, fontWeight: "bold", color: label },
      },
      // Received By value
      {
        id: "recv_value",
        type: "field",
        label: "Received By",
        field: "received_by",
        x: 310, y: 300, w: 67, h: 16,
        style: { fontSize: 10, color: text },
      },
      // Payment mode label
      {
        id: "payment_label",
        type: "static",
        label: "Payment Mode:",
        x: 20, y: 322, w: 100, h: 14,
        style: { fontSize: 9, fontWeight: "bold", color: labelLight },
      },
      // Payment mode value
      {
        id: "payment_value",
        type: "field",
        label: "Payment Mode",
        field: "payment_mode",
        x: 120, y: 322, w: 100, h: 14,
        style: { fontSize: 9, color: label },
      },
      // Divider 6
      {
        id: "divider6",
        type: "divider",
        label: "",
        x: 20, y: 342, w: 357, h: 2,
        style: { color: border },
      },
      // Islamic blessing
      {
        id: "blessing",
        type: "static",
        label: "تقبل اللہ منکم",
        x: 20, y: 352, w: 357, h: 28,
        style: { fontSize: 18, textAlign: "center", color: primary, fontWeight: "bold", fontFamily: "serif", direction: "rtl" },
      },
      // Divider 7
      {
        id: "divider7",
        type: "divider",
        label: "",
        x: 20, y: 388, w: 357, h: 1,
        style: { color: border },
      },
      // Footer address
      {
        id: "footer_address",
        type: "static",
        label: formatBrandingAddress(b) || "123 Islamic Street, Karachi, Pakistan",
        x: 20, y: 398, w: 357, h: 14,
        style: { fontSize: 9, textAlign: "center", color: muted },
      },
      // Footer phone + email
      {
        id: "footer_contact",
        type: "static",
        label: `Phone: ${b.phone || "+92 300 0000000"}   |   Email: ${b.email || "info@madrasa.edu.pk"}`,
        x: 20, y: 414, w: 357, h: 14,
        style: { fontSize: 9, textAlign: "center", color: muted },
      },
    ],
  };
}
