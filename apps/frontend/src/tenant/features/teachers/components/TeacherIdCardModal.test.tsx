import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { TeacherIdCardModal } from "./TeacherIdCardModal";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count) return `Batch (${params.count})`;
      return key;
    },
  }),
}));

vi.mock("@/components/ui/Modal", () => ({
  Modal: ({ title, children, footer }: {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div data-testid="modal">
      <h1>{title}</h1>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ),
}));

const mockTeacher: Teacher = {
  id: "tch-idcard-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  employeeId: "EMP-001",
  status: "active",
  gender: "male",
  specialization: "Tajweed & Qira'at",
  qualification: "Alimiyyah",
  phone: "+1 555-0200",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TeacherIdCardModal Component", () => {
  it("renders printable ID card preview with teacher details", () => {
    const html = renderToStaticMarkup(
      <TeacherIdCardModal
        open={true}
        onClose={vi.fn()}
        items={[
          {
            teacher: mockTeacher,
            assignedClasses: ["Class A - Tajweed"],
          },
        ]}
      />,
    );

    expect(html).toContain("teachers.idCard.title");
    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("EMP-001");
    expect(html).toContain("Class A - Tajweed");
    expect(html).toContain("Tajweed &amp; Qira&#x27;at");
    expect(html).toContain("Alimiyyah");
  });

  it("returns null when closed or items empty", () => {
    const htmlClosed = renderToStaticMarkup(
      <TeacherIdCardModal open={false} onClose={vi.fn()} items={[]} />,
    );
    expect(htmlClosed).toBe("");
  });
});
