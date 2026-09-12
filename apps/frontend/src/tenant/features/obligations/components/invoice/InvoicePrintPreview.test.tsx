import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvoicePrintPreview } from "./InvoicePrintPreview";
import type { InvoiceTemplate } from "@/lib/invoiceTemplateStore";
import type { ObligationCollection } from "@/lib/data/obligationsData";

vi.mock("@/tenant/hooks/useBranding", () => ({
  useBranding: () => ({
    madrasaName: "Al-Hujjah Madrasa",
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#0f766e",
    secondaryColor: "#0d9488",
  }),
}));

const sampleTemplate: InvoiceTemplate = {
  pageSize: "A6",
  elements: [
    {
      id: "el_logo",
      type: "logo",
      label: "Logo",
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    },
    {
      id: "el_static",
      type: "static",
      label: "Official Madrasa Receipt",
      x: 20,
      y: 70,
      w: 200,
      h: 20,
    },
    {
      id: "el_field_receipt",
      type: "field",
      label: "Receipt No",
      field: "receipt_no",
      x: 20,
      y: 100,
      w: 120,
      h: 16,
    },
    {
      id: "el_field_amount",
      type: "field",
      label: "Amount",
      field: "amount",
      x: 20,
      y: 130,
      w: 120,
      h: 20,
    },
    {
      id: "el_divider",
      type: "divider",
      label: "",
      x: 20,
      y: 160,
      w: 300,
      h: 2,
    },
    {
      id: "el_qr",
      type: "qrcode",
      label: "QR Code",
      x: 20,
      y: 170,
      w: 60,
      h: 60,
    },
  ],
};

const sampleCollection: ObligationCollection = {
  id: "obl_1001",
  receipt_no: "OBL-09999",
  received_date: "2026-09-12",
  sender_id: "c_donor_1",
  reference_id: null,
  amount: 25000,
  currency_id: "PKR",
  payment_mode: "Cash",
  obligation_type_id: "ot_khums",
  mujtahid_representative_id: "rep_1",
  received_by: "u_admin",
};

describe("InvoicePrintPreview Component", () => {
  it("renders static text elements correctly", () => {
    const html = renderToStaticMarkup(
      <InvoicePrintPreview
        template={sampleTemplate}
        collection={sampleCollection}
        showBoundary={false}
      />
    );
    expect(html).toContain("Official Madrasa Receipt");
  });

  it("resolves and renders field values from collection", () => {
    const html = renderToStaticMarkup(
      <InvoicePrintPreview
        template={sampleTemplate}
        collection={sampleCollection}
        lookups={{
          contacts: [{ id: "c_donor_1", name: "Syed Ali Raza" }],
        }}
        showBoundary={false}
      />
    );
    expect(html).toContain("OBL-09999");
  });

  it("renders QR code verification element", () => {
    const html = renderToStaticMarkup(
      <InvoicePrintPreview
        template={sampleTemplate}
        collection={sampleCollection}
        showBoundary={false}
      />
    );
    expect(html).toContain("Receipt Verification QR");
    expect(html).toContain("data:image/svg+xml");
  });

  it("renders text elements with visible overflow to avoid clipping", () => {
    const html = renderToStaticMarkup(
      <InvoicePrintPreview
        template={sampleTemplate}
        collection={sampleCollection}
        showBoundary={false}
      />
    );
    expect(html).toContain("overflow:visible");
  });
});
