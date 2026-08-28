import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceSettings } from "./AttendanceSettings";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useStandardModuleConfig", () => ({
  useAttendanceConfig: () => ({}),
}));

vi.mock("@/tenant/hooks/useModuleSettingsEditor", () => ({
  useModuleSettingsEditor: () => ({
    settingsDraft: {},
    saved: true,
    upd: vi.fn(),
    saveSettingsAsync: vi.fn(),
  }),
}));

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({
    canEditSetup: true,
  }),
}));

vi.mock("./AttendanceSettingsPreferencesSection", () => ({
  AttendanceSettingsPreferencesSection: () => <div data-testid="preferences-section">Preferences Section</div>,
}));

vi.mock("@/components/ui/ModuleSetupSaveFooter", () => ({
  ModuleSetupSaveFooter: () => <div data-testid="save-footer">Save Footer</div>,
}));

describe("AttendanceSettings Component", () => {
  it("renders preferences section and save footer", () => {
    const html = renderToStaticMarkup(<AttendanceSettings />);
    expect(html).toContain("Preferences Section");
    expect(html).toContain("Save Footer");
  });
});
