import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherCardActions } from "./TeacherCardActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-card-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const defaultProps = {
  teacher: mockTeacher,
  teacherId: "tch-card-1",
  displayName: "Ustadh Umar",
  showDeleted: false,
  canWrite: true,
  canDelete: true,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onRequestDelete: vi.fn(),
};

describe("TeacherCardActions Component", () => {
  it("renders view details button and overflow actions menu", () => {
    const html = renderToStaticMarkup(<TeacherCardActions {...defaultProps} />);

    expect(html).toContain("teachers.actionViewShort");
    expect(html).toContain("teachers.list.viewDetails - Ustadh Umar");
    expect(html).toContain("teachers.table.actions");
  });
});
