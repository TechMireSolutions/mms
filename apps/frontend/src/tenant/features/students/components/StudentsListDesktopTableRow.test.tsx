import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_STUDENT_COLUMN_REGISTRY, type Student } from "@mms/shared";
import { StudentsListDesktopTableRow } from "./StudentsListDesktopTableRow";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "students.table.selectStudent" && params?.name) {
        return `Select ${params.name}`;
      }
      const labels: Record<string, string> = {
        "students.table.emptyDash": "—",
        "students.detail.father": "Father",
        "students.detail.mother": "Mother",
      };
      return labels[key] ?? key;
    },
  }),
}));

const mockStudent: Student = {
  id: "std-row-1",
  contactId: "cnt-1",
  name: "Zayd Harith",
  gender: "male",
  grNumber: "GR-55",
  fatherName: "Harith",
  motherName: "Sumayyah",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const defaultProps = {
  studentRow: mockStudent,
  rowIndex: 0,
  sessions: [],
  selectedIds: ["std-row-1"],
  viewingDeleted: false,
  canWrite: true,
  canDelete: true,
  canWriteMessaging: true,
  statusBadgeConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  isColumnVisible: () => true,
  visibleColumns: DEFAULT_STUDENT_COLUMN_REGISTRY,
  onSelectOne: vi.fn(),
  onViewStudent: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRestore: vi.fn(),
  onOpenComposer: vi.fn(),
};

describe("StudentsListDesktopTableRow Component", () => {
  it("renders table row with checkbox, student name, and parent details", () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <StudentsListDesktopTableRow {...defaultProps} />
        </tbody>
      </table>,
    );

    expect(html).toContain("Zayd Harith");
    expect(html).toContain("Father:</span> Harith");
    expect(html).toContain("Mother:</span> Sumayyah");
    expect(html).toContain('aria-label="Select Zayd Harith"');
    expect(html).toContain('aria-checked="true"');
  });
});
