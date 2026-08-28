import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TeacherBasicSection,
  TeacherEmploymentSection,
} from "./TeacherFormSections";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TeacherFormSections Components", () => {
  it("renders TeacherBasicSection contact picker and details fields", () => {
    const html = renderToStaticMarkup(
      <TeacherBasicSection
        teacherDraft={{ specialization: "Tajweed" }}
        errors={{}}
        fields={{}}
        defaultSpecialization="Tajweed"
        linkedTeacherContactIds={[]}
        specializationOptions={["Tajweed", "Hifz"]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("contact-picker");
    expect(html).toContain("teachers.form.sectionDetails");
    expect(html).toContain("Tajweed");
  });

  it("renders TeacherEmploymentSection employeeId, status, and join date fields", () => {
    const html = renderToStaticMarkup(
      <TeacherEmploymentSection
        autoGenerateId={false}
        errors={{}}
        fields={{}}
        idPrefix="TCH-"
        nextEmployeeId="TCH-002"
        statusOptions={[{ value: "active", label: "Active" }]}
        teacherDraft={{ employeeId: "TCH-001", status: "active" }}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("teachers.form.sectionEmployment");
    expect(html).toContain("TCH-001");
  });
});
