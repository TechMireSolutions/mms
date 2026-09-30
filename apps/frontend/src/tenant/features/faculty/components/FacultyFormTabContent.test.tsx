import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyFormTabContent } from "./FacultyFormTabContent";

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
  formInstanceId: "inst-fac-1",
  facultyDraft: {
    employeeId: "EMP-001",
    notes: "Faculty notes sample",
  },
  errors: {},
  fields: {},
  defaultSpecialization: "Tajweed",
  linkedFacultyContactIds: [],
  specializationOptions: ["Tajweed", "Hifz"],
  autoGenerateId: false,
  idPrefix: "FAC-",
  statusOptions: [{ value: "active", label: "Active" }],
  isFieldEnabled: () => true,
  isFieldRequired: () => false,
  getFieldError: () => undefined,
  onDraftChange: vi.fn(),
};

describe("FacultyFormTabContent Component", () => {
  it("renders unified vertical layout with contact, employment, notes, and user account sections without details tab", () => {
    const html = renderToStaticMarkup(
      <FacultyFormTabContent
        {...defaultProps}
        facultyDraft={{ ...defaultProps.facultyDraft, contactId: "cnt-1" }}
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
    expect(html).not.toContain("faculty.form.sectionDetails");

    // Employment section
    expect(html).toContain("faculty.form.sectionEmployment");

    // Notes section
    expect(html).toContain("faculty.form.notesSection");
    expect(html).toContain("Faculty notes sample");

    // System User Account & RBAC section
    expect(html).toContain("user-account-section");
  });
});

