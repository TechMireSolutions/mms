import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherDetailNotesSection } from "./TeacherDetailNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TeacherDetailNotesSection Component", () => {
  it("renders teacher notes content and header", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailNotesSection notes="Senior instructor for advanced Tajweed curriculum." />,
    );

    expect(html).toContain("teachers.detail.notesSection");
    expect(html).toContain("Senior instructor for advanced Tajweed curriculum.");
  });
});
