import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherFormTabContent } from "./FacultyFormTabContent";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/tenant/features/faculty/components/FacultyUserAccountSection", () => ({
  FacultyUserAccountSection: () => <div data-testid="faculty-user-account-section">user-account-section</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  formInstanceId: "inst-tch-1",
  teacherDraft: {
    employeeId: "EMP-001",
    notes: "Teacher notes sample",
  },
  errors: {},
  fields: {},
  defaultSpecialization: "Tajweed",
  linkedTeacherContactIds: [],
  specializationOptions: ["Tajweed", "Hifz"],
  autoGenerateId: false,
  idPrefix: "TCH-",
  statusOptions: [{ value: "active", label: "Active" }],
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  getFieldError: () => undefined,
  onDraftChange: vi.fn(),
};

describe("TeacherFormTabContent Component", () => {
  it("renders unified vertical layout with contact, employment, notes, and user account sections without details tab", () => {
    const html = renderToStaticMarkup(
      <TeacherFormTabContent
        {...defaultProps}
        teacherDraft={{ ...defaultProps.teacherDraft, contactId: "cnt-1" }}
        linkedContact={{
          id: "cnt-1",
          name: "Ustadh Umar",
          phones: [{ number: "+923001234567" }],
          emails: [{ address: "umar@example.com" }],
          education: [{ degree: "M.A. Islamic Studies", fieldOfStudy: "Tajweed" }],
        } as unknown as import("@mms/shared").Contact}
      />
    );

    // Contact link / section
    expect(html).toContain("contact-picker");
    expect(html).toContain("3001234567");
    expect(html).toContain("umar@example.com");
    expect(html).toContain("M.A. Islamic Studies");
    expect(html).toContain("Tajweed");

    // Details tab / section is retired
    expect(html).not.toContain("teachers.form.sectionDetails");

    // Employment section
    expect(html).toContain("teachers.form.sectionEmployment");

    // Notes section
    expect(html).toContain("teachers.form.notesSection");
    expect(html).toContain("Teacher notes sample");

    // System User Account & RBAC section
    expect(html).toContain("user-account-section");
  });
});
