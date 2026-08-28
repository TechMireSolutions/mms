import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeIdBadge } from "./EmployeeIdBadge";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("EmployeeIdBadge Component", () => {
  it("renders Employee ID pill badge when employeeId is provided", () => {
    const html = renderToStaticMarkup(<EmployeeIdBadge employeeId="EMP-500" />);

    expect(html).toContain("teachers.employeeIdPrefix: EMP-500");
  });

  it("returns null when employeeId is null or empty", () => {
    const htmlNull = renderToStaticMarkup(<EmployeeIdBadge employeeId={null} />);
    expect(htmlNull).toBe("");

    const htmlEmpty = renderToStaticMarkup(<EmployeeIdBadge employeeId="" />);
    expect(htmlEmpty).toBe("");
  });
});
