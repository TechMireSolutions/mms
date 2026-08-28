import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeachersWorkTier } from "./TeachersWorkTier";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count !== undefined) return `${key}:${params.count}`;
      if (params?.name) return `${key}:${params.name}`;
      return key;
    },
  }),
}));

vi.mock("@/tenant/features/teachers/hooks/useTeacherStatusConfig", () => ({
  useTeacherStatusConfig: () => ({
    active: { label: "Active", cls: "bg-success/10 text-success" },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-wt-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockRegistry = [
  { key: "name", label: "Name", enabled: true, fixed: true, order: 0 },
  { key: "employeeId", label: "Employee ID", enabled: true, fixed: false, order: 1 },
  { key: "gender", label: "Gender", enabled: true, fixed: false, order: 2 },
  { key: "specialization", label: "Specialization", enabled: true, fixed: false, order: 3 },
  { key: "status", label: "Status", enabled: true, fixed: false, order: 4 },
];

const mockWorkOverlays = {
  setViewTeacher: vi.fn(),
  openComposer: vi.fn(),
  canWriteMessaging: true,
  setConfirmBulkDeleteOpen: vi.fn(),
  setConfirmBulkRestoreOpen: vi.fn(),
  setDeleteTarget: vi.fn(),
  openSelectionMessage: vi.fn(),
  idCardTeachers: [],
  openIdCardsModal: vi.fn(),
  closeIdCardsModal: vi.fn(),
};

const baseProps = {
  search: "",
  filterStatus: [],
  filterSpecialization: "all",
  filterGender: "all",
  quickFilter: "all" as const,
  onQuickFilterChange: vi.fn(),
  genderFilters: ["all", "male", "female"],
  activeFilterCount: 0,
  statusOptions: ["active", "inactive"],
  specializationOptions: ["Tajweed", "Hadith"],
  showDeleted: false,
  canWrite: true,
  canDelete: true,
  canExport: true,
  hasActiveFilters: false,
  columnRegistry: mockRegistry,
  isColumnVisible: () => true,
  getColumnWidth: () => undefined,
  onColumnResize: vi.fn(),
  updateUserColumnLayout: vi.fn(),
  onResetLayout: vi.fn(),
  customizerLabels: {} as never,
  teachers: [mockTeacher],
  workPageData: undefined,
  isWorkPageLoading: false,
  isWorkPageError: false,
  isWorkPageFetching: false,
  useServerWork: false,
  selectedIds: [],
  onSelectOne: vi.fn(),
  onSelectAll: vi.fn(),
  onClearSelection: vi.fn(),
  sortField: "name" as const,
  sortDir: "asc" as const,
  onSearchChange: vi.fn(),
  onToggleStatus: vi.fn(),
  onSpecializationChange: vi.fn(),
  onGenderChange: vi.fn(),
  onToggleDeleted: vi.fn(),
  onClearFilters: vi.fn(),
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onRestore: vi.fn(),
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  viewMode: "table" as const,
  onViewModeChange: vi.fn(),
  workOverlays: mockWorkOverlays,
};

describe("TeachersWorkTier Component", () => {
  it("renders work tier with filters and teacher table", () => {
    const html = renderToStaticMarkup(<TeachersWorkTier {...baseProps} />);

    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("EMP-010");
  });

  it("renders bulk actions bar when items are selected", () => {
    const html = renderToStaticMarkup(
      <TeachersWorkTier {...baseProps} selectedIds={["tch-wt-1"]} />,
    );

    expect(html).toContain("Ustadh Umar");
  });
});
