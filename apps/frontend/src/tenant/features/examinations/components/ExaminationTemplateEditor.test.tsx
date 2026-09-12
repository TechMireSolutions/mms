import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationTemplateEditor } from "./ExaminationTemplateEditor";

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

describe("ExaminationTemplateEditor", () => {
  it("renders the examinations template editor with report card fields", () => {
    const html = renderToStaticMarkup(<ExaminationTemplateEditor onClose={vi.fn()} />);

    expect(html).toContain("Examinations Document Template Editor");
    expect(html).toContain("Typst");
  });
});
