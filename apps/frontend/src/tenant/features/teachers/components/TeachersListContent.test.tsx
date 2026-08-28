import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHER_COLUMN_REGISTRY, type Teacher } from "@mms/shared";
import { TeachersListContent } from "./TeachersListContent";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "teachers.table.selectTeacher" && params?.name) {
        return `Select ${params.name}`;
      }
      if (key === "teachers.selectedCount" && params?.count != null) {
        return `${params.count} selected`;
      }
      const labels: Record<string, string> = {
        "teachers.table.selectAll": "Select All",
        "teachers.table.actions": "Actions",
        "teachers.table.emptyDash": "—",
        "teachers.tryAdjustingFilters": "Try adjusting your filters",
        "teachers.noTeachersMatchFilters": "No teachers match filters",
      };
      return labels[key] ?? key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-cnt-1",
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
  teachers: [mockTeacher],
  selectedIds: ["tch-cnt-1"],
  allSelected: true,
  someSelected: false,
  showDeleted: false,
  canWrite: true,
  canDelete: true,
  hasActiveFilters: false,
  isColumnVisible: () => true,
  columnRegistry: DEFAULT_TEACHER_COLUMN_REGISTRY,
  statusConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  sortField: "name" as const,
  sortDir: "asc" as const,
  onSort: vi.fn(),
  onSelectAll: vi.fn(),
  onSelectOne: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onRequestDelete: vi.fn(),
  viewMode: "table" as const,
};

describe("TeachersListContent Component", () => {
  it("renders desktop table view when viewMode is table", () => {
    const html = renderToStaticMarkup(<TeachersListContent {...defaultProps} />);

    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("EMP-010");
  });

  it("renders cards view when viewMode is cards", () => {
    const html = renderToStaticMarkup(
      <TeachersListContent {...defaultProps} viewMode="cards" />,
    );

    expect(html).toContain("Ustadh Umar");
  });

  it("renders empty state when teachers is empty", () => {
    const html = renderToStaticMarkup(
      <TeachersListContent
        {...defaultProps}
        teachers={[]}
        hasActiveFilters={true}
      />,
    );

    expect(html).toContain("No teachers match filters");
  });
});
