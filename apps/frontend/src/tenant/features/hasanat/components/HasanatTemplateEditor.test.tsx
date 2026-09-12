import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HasanatTemplateEditor } from "./HasanatTemplateEditor";

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

describe("HasanatTemplateEditor", () => {
  it("renders the hasanat template editor with award voucher fields", () => {
    const html = renderToStaticMarkup(<HasanatTemplateEditor onClose={vi.fn()} />);

    expect(html).toContain("Hasanat Voucher");
    expect(html).toContain("50 Hasanat");
  });
});
