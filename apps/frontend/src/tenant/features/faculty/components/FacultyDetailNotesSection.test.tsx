import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyDetailNotesSection } from "./FacultyDetailNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyDetailNotesSection Component", () => {
  it("renders faculty notes content and header", () => {
    const html = renderToStaticMarkup(
      <FacultyDetailNotesSection notes="Senior instructor for advanced Tajweed curriculum." />,
    );

    expect(html).toContain("faculty.detail.notesSection");
    expect(html).toContain("Senior instructor for advanced Tajweed curriculum.");
  });
});
