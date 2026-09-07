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

  it("renders accessible error attributes on qualification and employeeId when errors are present", () => {
    const basicHtml = renderToStaticMarkup(
      <TeacherBasicSection
        teacherDraft={{ qualification: "B.A. Islamic Studies" }}
        errors={{ qualification: "Invalid qualification" }}
        fields={{}}
        defaultSpecialization="Tajweed"
        linkedTeacherContactIds={[]}
        specializationOptions={["Tajweed"]}
        isFieldEnabled={() => true}
        isFieldRequired={() => true}
        onDraftChange={vi.fn()}
      />,
    );

    expect(basicHtml).toContain('id="qualification"');
    expect(basicHtml).toContain('aria-invalid="true"');
    expect(basicHtml).toContain('aria-describedby="qualification-error"');
    expect(basicHtml).toContain("border-destructive");

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
