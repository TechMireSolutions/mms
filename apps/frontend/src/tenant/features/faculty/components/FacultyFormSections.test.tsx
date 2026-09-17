import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TeacherBasicSection,
  TeacherContactSection,
  TeacherEmploymentSection,
} from "./FacultyFormSections";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TeacherFormSections Components", () => {
  it("renders TeacherContactSection with contact picker, phone, email, qualification, and specialization pills", () => {
    const html = renderToStaticMarkup(
      <TeacherContactSection
        teacherDraft={{ contactId: "cnt-1" }}
        linkedContact={{
          id: "cnt-1",
          name: "Ustadh Ali",
          phones: [{ number: "+923001234567" }],
          emails: [{ address: "ali@madrasa.org" }],
          education: [{ degree: "M.A. Islamic Studies", fieldOfStudy: "Hadith" }],
        } as any}
        linkedTeacherContactIds={[]}
        errors={{}}
        fields={{}}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("contact-picker");
    expect(html).toContain("3001234567");
    expect(html).toContain("ali@madrasa.org");
    expect(html).toContain("M.A. Islamic Studies");
    expect(html).toContain("Hadith");
  });

  it("renders TeacherBasicSection as null (retired in favor of contact education/skills)", () => {
    const html = renderToStaticMarkup(
      <TeacherBasicSection
        teacherDraft={{ specialization: "Tajweed" }}
        errors={{}}
        fields={{}}
        defaultSpecialization="Tajweed"
        specializationOptions={["Tajweed", "Hifz"]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toBe("");
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

  it("renders accessible error attributes on employeeId when errors are present", () => {

    const empHtml = renderToStaticMarkup(
      <TeacherEmploymentSection
        autoGenerateId={false}
        errors={{ employeeId: "Duplicate employee ID" }}
        fields={{}}
        idPrefix="TCH-"
        statusOptions={[{ value: "active", label: "Active" }]}
        teacherDraft={{ employeeId: "TCH-001", status: "active" }}
        isFieldEnabled={() => true}
        isFieldRequired={() => true}
        onDraftChange={vi.fn()}
      />,
    );

    expect(empHtml).toContain('id="employeeId"');
    expect(empHtml).toContain('aria-invalid="true"');
    expect(empHtml).toContain('aria-describedby="employeeId-error"');
    expect(empHtml).toContain("border-destructive");
  });
});
