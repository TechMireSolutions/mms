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
  it("renders student preferences section with template, digits, and toggle rows", () => {
    const html = renderToStaticMarkup(
      <StudentsPreferencesSection
        settingsDraft={DEFAULT_STUDENTS_SETTINGS}
        upd={vi.fn()}
      />,
    );

    expect(html).toContain("students.settings.grSectionTitle");
    expect(html).toContain("students.settings.grTemplate");
    expect(html).toContain("students.settings.grDigits");
    expect(html).toContain("students.settings.restartAnnually");
    expect(html).toContain("students.settings.autoGenerateId");
  });
});
