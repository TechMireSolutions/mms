import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentFormTabContent } from "./StudentFormTabContent";

vi.mock("@/tenant/hooks/collections/contacts", () => ({
  useContactsByIds: () => ({ data: [] }),
}));

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({ canWrite: true }),
}));

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/components/contactLink/ContactEditModal", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  formInstanceId: "inst-1",
  studentDraft: {
    grNumber: "GR-001",
    status: "active" as const,
    notes: "Student notes sample",
  },
  linkedGenderLabel: "Male",
  linkedDob: "2015-01-01",
  excludeIds: [],
  isGrAutoAssigned: false,
  grInputDisabled: false,
  statusSelectOptions: [{ value: "active", label: "Active" }],
  fields: {},
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  getFieldError: () => undefined,
  onContactSelect: vi.fn(),
  onStudentAvatarChange: vi.fn(),
  onGrNumberChange: vi.fn(),
  onDraftChange: vi.fn(),
};

describe("StudentFormTabContent Component", () => {
  it("renders registration and notes sections when tab is registration", () => {
    const html = renderToStaticMarkup(
      <StudentFormTabContent {...defaultProps} tab="registration" />,
    );

    expect(html).toContain("students.form.registrationSection");
    expect(html).toContain("students.form.notesSection");
    expect(html).toContain("Student notes sample");
  });

  it("renders contact and guardians sections when tab is basic", () => {
    const html = renderToStaticMarkup(
      <StudentFormTabContent {...defaultProps} tab="basic" />,
    );

    expect(html).toContain("students.form.contactLabel");
    expect(html).toContain("students.form.guardiansSection");
  });
});
