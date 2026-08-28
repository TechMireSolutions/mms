import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherDetailHero } from "./TeacherDetailHero";

const mockTeacher: Teacher = {
  id: "tch-hero-1",
  contactId: "cnt-tch-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockStatusConfig = {
  active: { label: "Active", cls: "bg-success/10 text-success" },
};

describe("TeacherDetailHero Component", () => {
  it("renders teacher name, employee ID badge, and status badge", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailHero
        teacher={mockTeacher}
        displayName="Ustadh Umar"
        statusConfig={mockStatusConfig}
        showStatus={true}
      />,
    );

    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("EMP-010");
    expect(html).toContain("Active");
  });

  it("omits status badge when showStatus is false", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailHero
        teacher={mockTeacher}
        displayName="Ustadh Umar"
        statusConfig={mockStatusConfig}
        showStatus={false}
      />,
    );

    expect(html).toContain("Ustadh Umar");
    expect(html).not.toContain("Active");
  });
});
