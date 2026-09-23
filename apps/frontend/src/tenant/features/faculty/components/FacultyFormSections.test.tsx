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

  it("derives hierarchy rank from a dynamic designation and renders the supervisor picker", () => {
    const html = renderToStaticMarkup(
      <TeacherEmploymentSection
        autoGenerateId={false}
        errors={{}}
        fields={{}}
        idPrefix="FAC-"
        statusOptions={[{ value: "active", label: "Active" }]}
        teacherDraft={{
          employeeId: "FAC-001",
          status: "active",
          hierarchyRank: 3,
          designationId: "senior-faculty",
          designationStartsOn: "2026-01-01",
          reportingFacultyId: "fac-sup-1",
        }}
        supervisorCandidates={[
          {
            id: "fac-sup-1",
            contactId: "cnt-sup-1",
            name: "Dean Ahmad",
            hierarchyRank: 1,
            designation: "Dean",
            status: "active",
          } as any,
        ]}
        designationOptions={[{
          id: "senior-faculty",
          code: "SENIOR",
          name: "Senior Faculty",
          hierarchyRank: 3,
          isActive: true,
          assignableRoles: ["teacher"],
        }]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="designationId"');
    expect(html).not.toContain('id="hierarchyRank"');
    expect(html).toContain('id="reportingFacultyId"');
    expect(html).toContain("Dean Ahmad");
    expect(html).toContain("Rank 1");
    // Verifies DatePicker was used instead of raw HTML5 date input (type="date" is banned)
    expect(html).not.toContain('type="date"');
    expect(html).toContain('id="designationStartsOn"');
  });

  it("renders department, specialization, and qualification when enabled", () => {
    const html = renderToStaticMarkup(
      <TeacherEmploymentSection
        autoGenerateId={false}
        errors={{}}
        fields={{}}
        idPrefix="FAC-"
        statusOptions={[{ value: "active", label: "Active" }]}
        teacherDraft={{
          employeeId: "FAC-001",
          status: "active",
          department: "Islamic Jurisprudence",
          specialization: "Fiqh",
          qualification: "Ph.D. Islamic Law",
        }}
        specializationOptions={["Fiqh", "Hadith", "Tafsir"]}
        isFieldEnabled={(fieldId) => ["department", "specialization", "qualification"].includes(fieldId)}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain('value="Islamic Jurisprudence"');
    expect(html).toContain('id="specialization"');
    expect(html).toContain("Fiqh");
    expect(html).toContain('id="qualification"');
    expect(html).toContain('value="Ph.D. Islamic Law"');
  });
});
