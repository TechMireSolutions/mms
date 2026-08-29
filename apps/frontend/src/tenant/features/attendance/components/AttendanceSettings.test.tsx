import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceSettings } from "./AttendanceSettings";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

let mockCanEdit = true;

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({
    canEditSetup: mockCanEdit,
  }),
}));

vi.mock("@/tenant/features/attendance/hooks/useAttendanceSetupPanelState", () => ({
  useAttendanceSetupPanelState: () => ({
    settingsDraft: {
      workingDays: ["monday", "tuesday"],
      cutoffTime: "09:00",
      lateThresholdMins: 15,
      autoAbsentAfterMins: 30,
      qrEnabled: true,
      lowAttendanceThreshold: 75,
      notifyParents: true,
      requireNoteForAbsent: true,
      lockAfterSubmit: true,
      trackHalfDay: true,
      weeklyReport: true,
      attendanceAlerts: true,
      allowManualOverride: true,
      offlineEnabled: false,
      geoTagging: false,
      defaultViewLayout: "list",
    },
    saved: true,
    saving: false,
    isPrefsDirty: false,
    isDirty: false,
    upd: vi.fn(),
    handleSave: vi.fn(),
  }),
}));

vi.mock("./AttendanceSettingsPreferencesSection", () => ({
  AttendanceSettingsPreferencesSection: () => (
    <div data-testid="preferences-section">Preferences Section</div>
  ),
}));

vi.mock("@/components/ui/ModuleSetupSaveFooter", () => ({
  ModuleSetupSaveFooter: () => <div data-testid="save-footer">Save Footer</div>,
}));

describe("AttendanceSettings Component", () => {
  it("renders preferences section and save footer when canEditSetup is true", () => {
    mockCanEdit = true;
    const html = renderToStaticMarkup(<AttendanceSettings />);
    expect(html).toContain("Preferences Section");
    expect(html).toContain("Save Footer");
  });

  it("renders read only message when canEditSetup is false", () => {
    mockCanEdit = false;
    const html = renderToStaticMarkup(<AttendanceSettings />);
    expect(html).toContain("attendance.settings.readOnly");
  });
});
