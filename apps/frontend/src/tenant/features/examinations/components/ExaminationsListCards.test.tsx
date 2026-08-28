import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationsListCards } from "./ExaminationsListCards";
import type { Exam } from "@/lib/data/examinationData";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./ExaminationsRowActions", () => ({
  ExaminationsRowActions: () => <div data-testid="row-actions">Row Actions</div>,
}));

const mockExam: Exam = {
  id: "ex-1",
  name: "Midterm Exam",
  subject: "Tajweed",
  date: "2025-01-01",
  duration: 60,
  totalMarks: 100,
  passingMarks: 50,
  classIds: ["cls-1"],
  status: "upcoming",
  description: "",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("ExaminationsListCards Component", () => {
  it("renders exam card layout with details", () => {
    const html = renderToStaticMarkup(
      <ExaminationsListCards
        viewMode="cards"
        exams={[mockExam]}
        selectedIds={[]}
        isColumnVisible={() => true}
        classes={[{ id: "cls-1", name: "Class 1A" }]}
        enrollments={[]}
        allVisibleSelected={false}
        someVisibleSelected={false}
        canWrite={true}
        canDelete={true}
        showDeleted={false}
        canTrashRows={true}
        statusConfig={{ upcoming: { label: "Upcoming", cls: "bg-info" } }}
        onEdit={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onToggleSelectedExam={vi.fn()}
        onTrashAction={vi.fn()}
      />,
    );

    expect(html).toContain("Midterm Exam");
    expect(html).toContain("Tajweed");
    expect(html).toContain("Class 1A");
  });
});
