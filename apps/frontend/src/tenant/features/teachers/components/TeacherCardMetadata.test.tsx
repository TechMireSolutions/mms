import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHER_COLUMN_REGISTRY, type Teacher } from "@mms/shared";
import { TeacherCardMetadata } from "./TeacherCardMetadata";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-meta-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherCardMetadata Component", () => {
  it("renders non-face metadata tiles for visible columns", () => {
    const html = renderToStaticMarkup(
      <TeacherCardMetadata
        teacher={mockTeacher}
        isColumnVisible={() => true}
        columnRegistry={DEFAULT_TEACHER_COLUMN_REGISTRY}
        customFieldsById={new Map()}
        statusConfig={{ active: { label: "Active", cls: "bg-success" } }}
      />,
    );

    expect(html).toContain("Tajweed");
    expect(html).toContain("Active");
  });

  it("returns null when no metadata columns are visible", () => {
    const html = renderToStaticMarkup(
      <TeacherCardMetadata
        teacher={mockTeacher}
        isColumnVisible={() => false}
        columnRegistry={DEFAULT_TEACHER_COLUMN_REGISTRY}
        customFieldsById={new Map()}
        statusConfig={{}}
      />,
    );

    expect(html).toBe("");
  });
});
