import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentDetailNotesSection } from "./StudentDetailNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("StudentDetailNotesSection Component", () => {
  it("renders student notes content and header", () => {
    const html = renderToStaticMarkup(
      <StudentDetailNotesSection notes="Student has excellent attendance in Hifz class." />,
    );

    expect(html).toContain("students.form.notesSection");
    expect(html).toContain("Student has excellent attendance in Hifz class.");
  });
});
