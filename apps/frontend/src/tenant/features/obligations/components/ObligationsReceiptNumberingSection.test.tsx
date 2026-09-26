import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ObligationsReceiptNumberingSection } from "./ObligationsReceiptNumberingSection";

describe("ObligationsReceiptNumberingSection Component", () => {
  it("renders receipt sequence numbering card with live preview and default values", () => {
    const html = renderToStaticMarkup(<ObligationsReceiptNumberingSection />);

    expect(html).toContain("Receipt Numbering");
    expect(html).toContain("Auto-generate Receipts");
    expect(html).toContain("Live Preview");
    expect(html).toContain("OBL-");
  });
});
