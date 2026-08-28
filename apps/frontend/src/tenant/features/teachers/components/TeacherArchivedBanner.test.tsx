import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherArchivedBanner } from "./TeacherArchivedBanner";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.date) return `${key}:${params.date}`;
      return key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-arch-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  deletedAt: "2024-06-01T12:00:00Z",
  deletionReason: "Retired",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherArchivedBanner Component", () => {
  it("renders archived banner with date and reason when teacher is deleted", () => {
    const html = renderToStaticMarkup(<TeacherArchivedBanner teacher={mockTeacher} />);

    expect(html).toContain("teachers.detail.archivedBanner");
    expect(html).toContain("Retired");
    expect(html).toContain("teachers.deletionReasonLabel");
  });

  it("returns null when teacher has no deletedAt", () => {
    const html = renderToStaticMarkup(
      <TeacherArchivedBanner teacher={{ ...mockTeacher, deletedAt: undefined }} />,
    );

    expect(html).toBe("");
  });
});
