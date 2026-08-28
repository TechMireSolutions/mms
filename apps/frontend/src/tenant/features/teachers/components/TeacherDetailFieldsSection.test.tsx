import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHERS_SETTINGS, type Teacher } from "@mms/shared";
import { TeacherDetailFieldsSection } from "./TeacherDetailFieldsSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-fields-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  phone: "+1 555-0100",
  email: "umar@example.com",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockDetailFields = [
  {
    key: "specialization",
    label: "Specialization",
    tab: "academic",
    type: "text",
    enabled: true,
    order: 0,
    isCustom: false,
  },
];

describe("TeacherDetailFieldsSection Component", () => {
  it("renders teacher fields and contact details grouped by tabs", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailFieldsSection
        teacher={mockTeacher}
        detailFields={mockDetailFields}
        displayName="Ustadh Umar"
        settings={DEFAULT_TEACHERS_SETTINGS}
      />,
    );

    expect(html).toContain("Specialization");
    expect(html).toContain("Tajweed");
    expect(html).toContain("555");
    expect(html).toContain("umar@example.com");
  });
});
