import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkAttendanceActions } from "./MarkAttendanceActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.total) return `${params.shown} of ${params.total} students`;
      return key;
    },
  }),
}));

describe("MarkAttendanceActions Component", () => {
  it("renders row summary count, save draft and submit attendance buttons", () => {
    const html = renderToStaticMarkup(
      <MarkAttendanceActions
        totalRows={20}
        visibleRows={20}
        isOffline={false}
        submitted={false}
        canWriteAttendance={true}
        onSaveDraft={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(html).toContain("20 of 20 students");
    expect(html).toContain("attendance.mark.saveDraft");
    expect(html).toContain("attendance.mark.submitAttendance");
  });
});
