import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyNotesSection } from "./FacultyNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  notes: "Full-time faculty member for Qirat level 3",
  fields: {},
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  onDraftChange: vi.fn(),
};

describe("FacultyNotesSection Component", () => {
  it("renders notes textarea input", () => {
    const html = renderToStaticMarkup(<FacultyNotesSection {...defaultProps} />);

    expect(html).toContain("faculty.form.notesSection");
    expect(html).toContain("Full-time faculty member for Qirat level 3");
  });

  it("returns null when notes field is disabled", () => {
    const html = renderToStaticMarkup(
      <FacultyNotesSection {...defaultProps} isFieldEnabled={() => false} />,
    );

    expect(html).toBe("");
  });
});
