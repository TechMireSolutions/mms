import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GrBadge } from "./GrBadge";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("GrBadge Component", () => {
  it("renders GR number pill badge when grNumber is provided", () => {
    const html = renderToStaticMarkup(<GrBadge grNumber="GR-1002" />);

    expect(html).toContain("students.grPrefix: GR-1002");
  });

  it("returns null when grNumber is null or empty", () => {
    const htmlNull = renderToStaticMarkup(<GrBadge grNumber={null} />);
    expect(htmlNull).toBe("");

    const htmlEmpty = renderToStaticMarkup(<GrBadge grNumber="" />);
    expect(htmlEmpty).toBe("");
  });
});
