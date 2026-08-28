import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceSetupTier } from "./AttendanceSetupTier";

vi.mock("./AttendanceSettings", () => ({
  AttendanceSettings: () => <div data-testid="attendance-settings">Attendance Settings</div>,
}));

describe("AttendanceSetupTier Component", () => {
  it("renders attendance settings component", () => {
    const html = renderToStaticMarkup(<AttendanceSetupTier />);
    expect(html).toContain("Attendance Settings");
  });
});
