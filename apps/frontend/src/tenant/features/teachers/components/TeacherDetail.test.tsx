import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_TEACHERS_SETTINGS, type Teacher } from "@mms/shared";
import { TeacherDetail } from "./TeacherDetail";

vi.mock("@/hooks/useStandardModuleConfig", () => ({
  useTeacherConfig: () => ({
    settings: DEFAULT_TEACHERS_SETTINGS,
    isFieldEnabled: () => true,
  }),
}));

vi.mock("@/tenant/features/teachers/components/useTeacherDetailModel", () => ({
  useTeacherDetailModel: (_teacher: Teacher) => ({
    statusConfig: {},
    detailFields: [],
    linkedContact: null,
    primaryPhone: "+1 555-0100",
    primaryEmail: "teacher@example.com",
    hasWhatsAppContact: false,
    hasVisibleDetailFields: false,
    assignedClasses: [],
    sessionsLoading: false,
    sessionsError: false,
  }),
}));

vi.mock("@/components/ui/DetailDrawerShell", () => ({
  DetailDrawerShell: ({ title, subtitle, children, headerActions, footer }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div data-testid="detail-drawer-shell">
      <h2>{title}</h2>
      <h3>{subtitle}</h3>
      <div>{headerActions}</div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.id) return `ID: ${params.id}`;
      return key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-detail-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-77",
  gender: "male",
  specialization: "Tajweed",
  notes: "Senior instructor note",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherDetail Component", () => {
  it("renders teacher detail drawer with title, Employee ID, notes, and actions", () => {
    const html = renderToStaticMarkup(
      <TeacherDetail
        teacher={mockTeacher}
        onClose={vi.fn()}
        openComposer={vi.fn()}
        canWriteMessaging={true}
        onPrintIdCard={vi.fn()}
      />,
    );

    expect(html).toContain("teachers.detail.title");
    expect(html).toContain("ID: EMP-77");
    expect(html).toContain("Senior instructor note");
    expect(html).toContain("teachers.detail.printIdCard");
  });
});
