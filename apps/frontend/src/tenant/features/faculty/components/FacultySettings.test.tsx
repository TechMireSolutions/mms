import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHERS_SETTINGS } from "@mms/shared";
import { FacultySettings } from "./FacultySettings";

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({ canEditSetup: true }),
}));

vi.mock("@/tenant/features/faculty/hooks/useFacultyStatusConfig", () => ({
  useFacultyLookupOptions: () => ({
    specializationOptions: ["Tajweed", "Hifz"],
  }),
  useTeacherLookupOptions: () => ({
    specializationOptions: ["Tajweed", "Hifz"],
  }),
}));

vi.mock("@/tenant/features/faculty/hooks/useFacultySetupPanelState", () => ({
  useFacultySetupPanelState: () => ({
    settingsDraft: DEFAULT_TEACHERS_SETTINGS,
    saved: false,
    saving: false,
    isPrefsDirty: false,
    upd: vi.fn(),
    handleSave: vi.fn(),
  }),
  useTeachersSetupPanelState: () => ({
    settingsDraft: DEFAULT_TEACHERS_SETTINGS,
    saved: false,
    saving: false,
    isPrefsDirty: false,
    upd: vi.fn(),
    handleSave: vi.fn(),
  }),
}));

vi.mock("@/tenant/features/faculty/components/FacultyDesignationsSetupSection", () => ({
  FacultyDesignationsSetupSection: () => <div>faculty.designations.setupTitle</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultySettings Component", () => {
  it("renders faculty settings section card and save footer", () => {
    const html = renderToStaticMarkup(<FacultySettings />);

    expect(html).toContain("faculty.settings.title");
    expect(html).toContain("common.save");
    expect(html).toContain("faculty.designations.setupTitle");
  });
});
