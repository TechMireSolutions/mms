import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FinanceTemplateEditor } from "./FinanceTemplateEditor";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/hooks/useBranding", () => ({
  useBranding: () => ({
    logoUrl: null,
  }),
}));

vi.mock("@/lib/db", () => ({
  getObject: (_key: string, fallback: unknown) => fallback,
  saveObject: vi.fn(),
}));

describe("FinanceTemplateEditor", () => {
  it("renders the finance document template editor with fee receipt fields", () => {
    const html = renderToStaticMarkup(<FinanceTemplateEditor onClose={vi.fn()} />);

    expect(html).toContain("finance.templateEditorTitle");
    expect(html).toContain("Typst");
    expect(html).toContain("Zoho");
  });
});
