import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherDetailQuickActions } from "./TeacherDetailQuickActions";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.phone) return `${key}:${params.phone}`;
      return key;
    },
  }),
}));

const mockTeacher: Teacher = {
  id: "tch-qa-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  employeeId: "EMP-010",
  gender: "male",
  specialization: "Tajweed",
  phone: "+1 555-0100",
  email: "umar@example.com",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherDetailQuickActions Component", () => {
  it("renders quick action channels when messaging is enabled", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailQuickActions
        teacher={mockTeacher}
        displayName="Ustadh Umar"
        primaryPhone="+1 555-0100"
        primaryEmail="umar@example.com"
        hasWhatsAppContact={true}
        canWriteMessaging={true}
        onOpenComposer={vi.fn()}
      />,
    );

    expect(html).toContain("teachers.detail.call");
    expect(html).toContain("teachers.list.actionWhatsApp");
    expect(html).toContain("teachers.list.actionSms");
    expect(html).toContain("teachers.list.actionEmail");
  });
});
