import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_STUDENTS_SETTINGS } from "@mms/shared";
import { StudentsPreferencesSection } from "./StudentsPreferencesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("StudentsPreferencesSection Component", () => {
  it("renders student GR number sequence configuration with live preview", () => {
    const html = renderToStaticMarkup(
      <StudentsPreferencesSection
        settingsDraft={DEFAULT_STUDENTS_SETTINGS}
        upd={vi.fn()}
      />,
    );

    expect(html).toContain("students.settings.grSectionTitle");
    expect(html).toContain("Auto-generate Student GR Numbers");
    expect(html).toContain("Live Preview");
    expect(html).toContain("Starting Sequence");
    expect(html).toContain("Sequence Digits");
  });
});
