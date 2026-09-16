import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentCardTemplateEditor } from "./StudentCardTemplateEditor";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/hooks/useBranding", () => ({
  useBranding: () => ({
    madrasaName: "Test Madrasa",
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#059669",
    secondaryColor: "#047857",
  }),
}));

vi.mock("@/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StudentCardTemplateEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the editor with title, side switcher, and presets", () => {
    const html = renderToStaticMarkup(<StudentCardTemplateEditor onClose={vi.fn()} />);

    expect(html).toContain("students.cardTemplate.title");
    expect(html).toContain("students.cardTemplate.side.front");
    expect(html).toContain("students.cardTemplate.side.back");
    expect(html).toContain("students.cardTemplate.presetStandard");
    expect(html).toContain("students.cardTemplate.presetBadge");
    expect(html).toContain("students.cardTemplate.presetMinimal");
  });
});
