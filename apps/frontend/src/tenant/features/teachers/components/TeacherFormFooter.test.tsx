import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact, Teacher } from "@mms/shared";
import { TeacherFormFooter } from "./TeacherFormFooter";

const mockContact: Contact = {
  id: "cnt-1",
  firstName: "Ustadh",
  lastName: "Umar",
  name: "Ustadh Umar",
  type: "teacher",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockTeacherDraft: Partial<Teacher> = {
  employeeId: "EMP-001",
  status: "active",
};

const mockStatusConfig = {
  active: { label: "Active", cls: "bg-success" },
};

const mockT = (key: string, params?: Record<string, string | number>) => {
  if (params?.id) return `ID: ${params.id}`;
  return key;
};

describe("TeacherFormFooter Component", () => {
  it("renders linked contact name, employee ID, and status badge", () => {
    const html = renderToStaticMarkup(
      <TeacherFormFooter
        linkedContact={mockContact}
        teacherDraft={mockTeacherDraft}
        requireContactLink={false}
        statusConfig={mockStatusConfig}
        t={mockT}
      />,
    );

    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("ID: EMP-001");
    expect(html).toContain("Active");
  });

  it("renders contact required banner when contact is required and unlinked", () => {
    const html = renderToStaticMarkup(
      <TeacherFormFooter
        linkedContact={null}
        teacherDraft={{}}
        requireContactLink={true}
        statusConfig={mockStatusConfig}
        t={mockT}
      />,
    );

    expect(html).toContain("teachers.form.contactRequired");
  });

  it("returns null when no contact and link not required", () => {
    const html = renderToStaticMarkup(
      <TeacherFormFooter
        linkedContact={null}
        teacherDraft={{}}
        requireContactLink={false}
        statusConfig={mockStatusConfig}
        t={mockT}
      />,
    );

    expect(html).toBe("");
  });
});
