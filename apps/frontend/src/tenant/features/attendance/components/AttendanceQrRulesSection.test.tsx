import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceQrRulesSection } from "./AttendanceQrRulesSection";
import type { AttendanceSettings } from "@mms/shared";

describe("AttendanceQrRulesSection Component", () => {
  it("renders qr attendance section and its save button", () => {
    const html = renderToStaticMarkup(
      <AttendanceQrRulesSection
        settingsDraft={{ qrEnabled: true } as AttendanceSettings}
        upd={vi.fn()}
        isPrefsDirty={true}
        onSave={vi.fn()}
      />,
    );

    expect(html).toContain("attendance.settings.qrAttendance");
    expect(html).toContain("attendance.settings.enableQr");
    expect(html).toContain("common.save");
  });
});
