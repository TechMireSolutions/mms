import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherCardHeader } from "./TeacherCardHeader";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.name) return `${key}:${params.name}`;
      return key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-card-1",
  contactId: "cnt-tch-1",
  name: "Ustadha Fatima",
  firstName: "Fatima",
  lastName: "Zahra",
  gender: "female",
  employeeId: "EMP-404",
  status: "active",
  roles: ["teacher"],
  department: "Quranic Sciences",
  subjects: ["Tajweed"],
  hireDate: "2023-01-01",
  dob: "1990-01-01",
  nationalId: "12345-1234567-1",
  address: "Qom",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherCardHeader Component", () => {
  it("renders teacher name, employee ID, and gender meta by default", () => {
    const html = renderToStaticMarkup(
      <TeacherCardHeader
        teacher={mockTeacher}
        teacherId="tch-card-1"
        isSelected={false}
        displayName="Ustadha Fatima"
        onSelectOne={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(html).toContain("Ustadha Fatima");
    expect(html).toContain("EMP-404");
    expect(html).toContain("Female");
    expect(html).toContain('aria-label="teachers.table.selectTeacher:Ustadha Fatima"');
  });

  it("hides employee ID and gender when isColumnVisible returns false", () => {
    const html = renderToStaticMarkup(
      <TeacherCardHeader
        teacher={mockTeacher}
        teacherId="tch-card-1"
        isSelected={false}
        displayName="Ustadha Fatima"
        isColumnVisible={() => false}
        onSelectOne={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(html).toContain("Ustadha Fatima");
    expect(html).not.toContain("EMP-404");
    expect(html).not.toContain("Female");
  });

  it("renders checked state when isSelected is true", () => {
    const html = renderToStaticMarkup(
      <TeacherCardHeader
        teacher={mockTeacher}
        teacherId="tch-card-1"
        isSelected={true}
        displayName="Ustadha Fatima"
        onSelectOne={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(html).toContain('aria-checked="true"');
  });
});
