import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_ACCOUNTING_SETTINGS } from "@mms/shared";
import { AccountingSettingsNumberingSection } from "./AccountingSettingsNumberingSection";

describe("AccountingSettingsNumberingSection Component", () => {
  it("renders journal voucher sequence numbering card with live preview and default values", () => {
    const html = renderToStaticMarkup(
      <AccountingSettingsNumberingSection
        settingsDraft={DEFAULT_ACCOUNTING_SETTINGS}
        upd={vi.fn()}
      />
    );

    expect(html).toContain("Journal Voucher / Entry Numbering");
    expect(html).toContain("Auto-generate Journal Vouchers");
    expect(html).toContain("Live Preview");
    expect(html).toContain("{PREFIX}-{SEQ}");
    expect(html).toContain("JE-0001");
  });
});
