import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHERS_SETTINGS } from "@mms/shared";
import { TeachersPreferencesSection } from "./TeachersPreferencesSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TeachersPreferencesSection Component", () => {
  it("renders teacher preferences section with idPrefix, autoGenerateId, and specialization select", () => {
    const html = renderToStaticMarkup(
      <TeachersPreferencesSection
        settingsDraft={DEFAULT_TEACHERS_SETTINGS}
        upd={vi.fn()}
        specializationOptions={["Tajweed", "Hifz"]}
      />,
    );

    expect(html).toContain("teachers.settings.idPrefix");
    expect(html).toContain("teachers.settings.autoGenerateId");
    expect(html).toContain("teachers.settings.requireContactLink");
    expect(html).toContain("teachers.settings.defaultSpecialization");
  });
});
