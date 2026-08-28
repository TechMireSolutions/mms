import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersBulkActionBar } from "./TeachersBulkActionBar";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count !== undefined) return `${key}:${params.count}`;
      return key;
    },
  }),
}));

const defaultProps = {
  selectedIds: ["tch-1", "tch-2"],
  selectionTargets: { waTargets: [], smsReady: [], emailReady: [] },
  showDeleted: false,
  canWrite: true,
  canDelete: true,
  canWriteMessaging: true,
  canExport: true,
  statusConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  specializationOptions: ["Tajweed", "Hadith"],
  onWhatsApp: vi.fn(),
  onSms: vi.fn(),
  onEmail: vi.fn(),
  onBulkStatusChange: vi.fn(),
  onBulkSpecializationChange: vi.fn(),
  onBulkPrintIdCards: vi.fn(),
  onBulkExport: vi.fn(),
  onRequestBulkDelete: vi.fn(),
  onRequestBulkRestore: vi.fn(),
  onClearSelection: vi.fn(),
};

describe("TeachersBulkActionBar Component", () => {
  it("renders bulk action bar with selected count and actions", () => {
    const html = renderToStaticMarkup(<TeachersBulkActionBar {...defaultProps} />);

    expect(html).toContain("teachers.selectedCount:2");
    expect(html).toContain("teachers.bulkStatus");
    expect(html).toContain("teachers.bulkSpecialization");
    expect(html).toContain("teachers.idCard.print");
    expect(html).toContain("teachers.bulkExport");
  });

  it("renders restore action when showDeleted is true", () => {
    const html = renderToStaticMarkup(
      <TeachersBulkActionBar {...defaultProps} showDeleted={true} />,
    );

    expect(html).toContain("teachers.bulkRestore");
  });
});
