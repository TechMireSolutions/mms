import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHERS_SETTINGS } from "@mms/shared";
import { TeachersPreferencesSection } from "./FacultyPreferencesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyPreferencesSection Component", () => {
  it("renders faculty preferences section with idPrefix, autoGenerateId, and specialization select", () => {
    const html = renderToStaticMarkup(
      <TeachersPreferencesSection
        settingsDraft={DEFAULT_TEACHERS_SETTINGS}
        upd={vi.fn()}
        specializationOptions={["Tajweed", "Hifz"]}
      />,
    );

    expect(html).toContain("faculty.settings.idSectionTitle");
    expect(html).toContain("faculty.settings.idTemplate");
    expect(html).toContain("faculty.settings.idDigits");
    expect(html).toContain("faculty.settings.idStartSeq");
    expect(html).toContain("faculty.settings.idPrefix");
    expect(html).toContain("faculty.settings.autoGenerateId");
    expect(html).toContain("faculty.settings.requireContactLink");
    expect(html).toContain("faculty.settings.defaultSpecialization");
    expect(html).toContain("faculty.settings.preview");
  });
});
