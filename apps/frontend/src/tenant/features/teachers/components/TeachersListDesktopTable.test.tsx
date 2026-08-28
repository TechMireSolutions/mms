import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHER_COLUMN_REGISTRY, type Teacher } from "@mms/shared";
import { TeachersListDesktopTable } from "./TeachersListDesktopTable";

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
        "teachers.deletionReasonLabel": "Reason",
      };
      return labels[key] ?? key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-101",
  contactId: "cnt-tch-101",
  name: "Sheikh Jawad",
  firstName: "Jawad",
  lastName: "Kazmi",
  gender: "male",
  employeeId: "EMP-909",
  status: "active",
  roles: ["teacher"],
  department: "Islamic Studies",
  subjects: ["Fiqh", "Hadith"],
  hireDate: "2022-09-01",
  dob: "1985-04-12",
  nationalId: "12345-6789012-3",
  address: "Najaf",
  notes: "Senior faculty member",
  deletionReason: "Relocated",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const defaultProps = {
  viewMode: "table" as const,
  teachers: [mockTeacher],
  selectedIds: ["tch-101"],
  allSelected: true,
  someSelected: false,
  showDeleted: true,
  canWrite: true,
  canDelete: true,
  hasActiveFilters: false,
  isColumnVisible: () => true,
  columnRegistry: DEFAULT_TEACHER_COLUMN_REGISTRY,
  customFieldsById: new Map(),
  statusConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  sortField: "name" as const,
  sortDir: "asc" as const,
  onSort: vi.fn(),
  onSelectAll: vi.fn(),
  onSelectOne: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onRequestDelete: vi.fn(),
};

describe("TeachersListDesktopTable Component", () => {
  it("renders desktop table with teacher row, avatar, employeeId, and deletion reason", () => {
    const html = renderToStaticMarkup(<TeachersListDesktopTable {...defaultProps} />);

    expect(html).toContain("Sheikh Jawad");
    expect(html).toContain("EMP-909");
    expect(html).toContain("Reason: Relocated");
    expect(html).toContain("1 selected");
    expect(html).toContain('aria-label="Select Sheikh Jawad"');
  });

  it("renders empty table footer when no teachers are present", () => {
    const html = renderToStaticMarkup(
      <TeachersListDesktopTable
        {...defaultProps}
        teachers={[]}
        selectedIds={[]}
        allSelected={false}
        someSelected={false}
      />,
    );

    expect(html).toContain("0 teachers.table.teachers");
    expect(html).not.toContain("0 selected");
  });
});
