import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersPageOverlays } from "./TeachersPageOverlays";

vi.mock("@/tenant/hooks/collections/sessions", () => ({
  useSessions: () => ({ data: [] }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/teachers/components/TeachersPageConfirmDialogs", () => ({
  TeachersPageConfirmDialogs: ({ bulkDeleteOpen }: { bulkDeleteOpen?: boolean }) => (
    <div data-testid="confirm-dialogs">dialogs-rendered:{String(bulkDeleteOpen)}</div>
  ),
}));

const defaultProps = {
  showForm: false,
  editTeacher: null,
  onCloseForm: vi.fn(),
  onSave: vi.fn(),
  viewTeacher: null,
  onCloseView: vi.fn(),
  onEditFromDrawer: vi.fn(),
  onRestoreFromDrawer: vi.fn(),
  messagingTarget: null,
  onCloseComposer: vi.fn(),
  openComposer: vi.fn(),
  canWriteMessaging: true,
  canWrite: true,
  canDelete: true,
  bulkDeleteOpen: false,
  onBulkDeleteOpenChange: vi.fn(),
  selectedCount: 0,
  onConfirmBulkDelete: vi.fn(),
  deleteTarget: null,
  onDeleteTargetOpenChange: vi.fn(),
  onConfirmSingleDelete: vi.fn(),
  bulkRestoreOpen: false,
  onBulkRestoreOpenChange: vi.fn(),
  onConfirmBulkRestore: vi.fn(),
  idCardTeachers: [],
  onCloseIdCards: vi.fn(),
};

describe("TeachersPageOverlays Component", () => {
  it("renders confirm dialogs and overlays structure", () => {
    const html = renderToStaticMarkup(
      <TeachersPageOverlays {...defaultProps} bulkDeleteOpen={true} />,
    );

    expect(html).toContain("dialogs-rendered:true");
  });
});
