import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceListCards } from "./AttendanceListCards";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/data/attendanceData";

const mockRecord: AttendanceRecord = {
  id: "rec-1",
  studentId: "std-1",
  studentName: "Bilal Ahmad",
  rollNo: "GR-001",
  classId: "cls-1",
  date: "2025-01-01",
  status: "present",
  timeIn: "08:00",
  timeOut: "12:00",
  notes: "On time",
  createdAt: "2025-01-01T08:00:00Z",
  updatedAt: "2025-01-01T08:00:00Z",
};

const mockStatuses: AttendanceStatus[] = [
  { id: "present", label: "Present", short: "P", color: "#10b981", bg: "bg-success", text: "text-success", border: "border-success", dot: "bg-success" },
];

describe("AttendanceListCards Component", () => {
  it("renders mobile card layout with student details", () => {
    const html = renderToStaticMarkup(
      <AttendanceListCards
        paginatedRecords={[mockRecord]}
        isColumnVisible={() => true}
        editingRecord={null}
        statuses={mockStatuses}
        updateDraft={vi.fn()}
        classLabel={() => "Class 1A"}
        renderRowActions={() => <div>Actions</div>}
        selectedIds={[]}
        canDelete={true}
        allVisibleSelected={false}
        someVisibleSelected={false}
        onToggleSelectAll={vi.fn()}
        onToggleSelectedRecord={vi.fn()}
        t={((k: string) => k) as any}
      />,
    );

    expect(html).toContain("Bilal Ahmad");
    expect(html).toContain("Class 1A");
    expect(html).toContain("On time");
  });

  it("renders empty state when no records", () => {
    const html = renderToStaticMarkup(
      <AttendanceListCards
        paginatedRecords={[]}
        isColumnVisible={() => true}
        editingRecord={null}
        statuses={mockStatuses}
        updateDraft={vi.fn()}
        classLabel={() => "Class 1A"}
        renderRowActions={() => <div>Actions</div>}
        selectedIds={[]}
        canDelete={true}
        allVisibleSelected={false}
        someVisibleSelected={false}
        onToggleSelectAll={vi.fn()}
        onToggleSelectedRecord={vi.fn()}
        t={((k: string) => k) as any}
      />,
    );

    expect(html).toContain("attendance.empty.records");
  });
});
