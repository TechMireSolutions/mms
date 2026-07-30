import { formatBrandingAddress } from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { BrandingInfo, InvoiceTemplate } from "./invoiceTemplateTypes.js";

export function buildInvoiceTemplateFooterElements(
  b: BrandingInfo,
  primary: string,
): InvoiceTemplate["elements"] {
  const { muted, border } = PRINT_NEUTRAL;
  return [
    {
      id: "divider6",
      type: "divider",
      label: "",
      x: 20, y: 342, w: 357, h: 2,
      style: { color: border },
    },
    {
      id: "blessing",
      type: "static",
      label: "تقبل اللہ منکم",
      x: 20, y: 352, w: 357, h: 28,
      style: { fontSize: 18, textAlign: "center", color: primary, fontWeight: "bold", fontFamily: "serif", direction: "rtl" },
    },
    {
      id: "divider7",
      type: "divider",
      label: "",
      x: 20, y: 388, w: 357, h: 1,
      style: { color: border },
    },
    {
      id: "footer_address",
      type: "static",
      label: formatBrandingAddress(b) || "123 Islamic Street, Karachi, Pakistan",
      x: 20, y: 398, w: 357, h: 14,
      style: { fontSize: 9, textAlign: "center", color: muted },
    },
    {
      id: "footer_contact",
      type: "static",
      label: `Phone: ${b.phone || "+92 300 0000000"}   |   Email: ${b.email || "info@madrasa.edu.pk"}`,
      x: 20, y: 414, w: 357, h: 14,
      style: { fontSize: 9, textAlign: "center", color: muted },
    },
  ];
}
