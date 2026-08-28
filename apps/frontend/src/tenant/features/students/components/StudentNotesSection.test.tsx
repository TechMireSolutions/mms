import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentNotesSection } from "./StudentNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  notes: "Enrolled with sibling discount",
  fields: {},
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  onDraftChange: vi.fn(),
};

describe("StudentNotesSection Component", () => {
  it("renders notes textarea input", () => {
    const html = renderToStaticMarkup(<StudentNotesSection {...defaultProps} />);

    expect(html).toContain("students.form.notesSection");
    expect(html).toContain("Enrolled with sibling discount");
  });

  it("returns null when notes field is disabled", () => {
    const html = renderToStaticMarkup(
      <StudentNotesSection {...defaultProps} isFieldEnabled={() => false} />,
    );

    expect(html).toBe("");
  });
});
