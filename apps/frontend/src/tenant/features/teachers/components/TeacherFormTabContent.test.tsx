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
  it("renders unified vertical layout with contact, basic, employment, and notes sections simultaneously", () => {
    const html = renderToStaticMarkup(
      <TeacherFormTabContent
        {...defaultProps}
        teacherDraft={{ ...defaultProps.teacherDraft, contactId: "cnt-1" }}
        linkedContact={{
          id: "cnt-1",
          name: "Ustadh Umar",
          phone: "+923001234567",
          email: "umar@example.com",
        } as unknown as import("@mms/shared").Contact}
      />
    );

    // Contact link / section
    expect(html).toContain("contact-picker");
    expect(html).toContain("3001234567");
    expect(html).toContain("umar@example.com");

    // Basic & employment sections
    expect(html).toContain("teachers.field.specialization");
    expect(html).toContain("Tajweed");

    // Notes section
    expect(html).toContain("teachers.form.notesSection");
    expect(html).toContain("Teacher notes sample");
  });
});
