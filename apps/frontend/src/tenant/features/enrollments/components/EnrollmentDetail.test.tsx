import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentDetail } from "./EnrollmentDetail";
import type { Enrollment } from "@/lib/data/enrollmentData";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useCurrency", () => ({
  useFinanceCurrency: () => ({
    formatCurrency: (val: number) => `$${val}`,
  }),
}));

vi.mock("@/tenant/hooks/collections/students", () => ({
  useStudentsByIds: () => ({
    data: [{ id: "std-1", name: "Ali Hassan", grNumber: "GR-001" }],
  }),
}));

vi.mock("@/components/ui/DetailDrawerShell", () => ({
  DetailDrawerShell: ({ title, subtitle, headerExtra, children }: {
    title: string;
    subtitle?: string;
    headerExtra?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="drawer-shell">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div>{headerExtra}</div>
      <div>{children}</div>
    </div>
  ),
}));

const mockEnrollment: Enrollment = {
  id: "enr-1",
  studentId: "std-1",
  studentName: "Bilal Ahmad",
  sessionId: "ses-1",
  sessionName: "Spring 2025",
  classId: "cls-1",
  className: "Hifz 1",
  enrolledDate: "2025-01-01T00:00:00Z",
  baseFee: 100,
  discountPct: 0,
  finalFee: 100,
  status: "confirmed",
  paymentStatus: "paid",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
} as unknown as Enrollment;

describe("EnrollmentDetail Component", () => {
  it("renders detail drawer with student, session, and fee details", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        enrollment={mockEnrollment}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        canWrite={true}
      />,
    );

    expect(html).toContain("Ali Hassan");
    expect(html).toContain("Spring 2025");
    expect(html).toContain("Hifz Class A");
    expect(html).toContain("$100");
  });
});
