import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceSettingRow } from "./AttendanceSettingRow";

describe("AttendanceSettingRow Component", () => {
  it("renders label, subtext, and children", () => {
    const html = renderToStaticMarkup(
      <AttendanceSettingRow label="Late Threshold" sub="Minutes until marked late">
        <input type="number" defaultValue={15} />
      </AttendanceSettingRow>,
    );

    expect(html).toContain("Late Threshold");
    expect(html).toContain("Minutes until marked late");
    expect(html).toContain('value="15"');
  });
});
