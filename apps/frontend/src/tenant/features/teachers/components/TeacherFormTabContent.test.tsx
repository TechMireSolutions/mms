import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherFormTabContent } from "./TeacherFormTabContent";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
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
  it("renders employment and notes sections when tab is employment", () => {
    const html = renderToStaticMarkup(
      <TeacherFormTabContent {...defaultProps} tab="employment" />,
    );

    expect(html).toContain("teachers.form.notesSection");
    expect(html).toContain("Teacher notes sample");
  });

  it("renders basic section when tab is basic", () => {
    const html = renderToStaticMarkup(
      <TeacherFormTabContent {...defaultProps} tab="basic" />,
    );

    expect(html).toContain("teachers.field.specialization");
    expect(html).toContain("Tajweed");
  });
});
