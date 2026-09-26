import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_FINANCE_SETTINGS } from "@mms/shared";
import { FinanceInvoiceNumberingSection } from "./FinanceInvoiceNumberingSection";

describe("FinanceInvoiceNumberingSection Component", () => {
  it("renders fee invoice sequence numbering card with live preview and default values", () => {
    const html = renderToStaticMarkup(
      <FinanceInvoiceNumberingSection
        settingsDraft={DEFAULT_FINANCE_SETTINGS}
        upd={vi.fn()}
      />
    );

    expect(html).toContain("Fee Invoice Numbering");
    expect(html).toContain("Auto-generate Fee Invoices");
    expect(html).toContain("Live Preview");
    expect(html).toContain("INV-");
  });
});
