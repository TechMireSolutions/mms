import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherNotesSection } from "./TeacherNotesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  notes: "Full-time teacher for Qirat level 3",
  fields: {},
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  onDraftChange: vi.fn(),
};

describe("TeacherNotesSection Component", () => {
  it("renders notes textarea input", () => {
    const html = renderToStaticMarkup(<TeacherNotesSection {...defaultProps} />);

    expect(html).toContain("teachers.form.notesSection");
    expect(html).toContain("Full-time teacher for Qirat level 3");
  });

  it("returns null when notes field is disabled", () => {
    const html = renderToStaticMarkup(
      <TeacherNotesSection {...defaultProps} isFieldEnabled={() => false} />,
    );

    expect(html).toBe("");
  });
});
