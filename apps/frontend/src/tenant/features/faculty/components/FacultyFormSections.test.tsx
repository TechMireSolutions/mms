import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FacultyBasicSection,
  FacultyContactSection,
  FacultyEmploymentSection,
} from "./FacultyFormSections";
import { FacultyFormDesignationSection } from "./FacultyFormDesignationSection";
import { FacultyFormHierarchySection } from "./FacultyFormHierarchySection";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyFormSections Components", () => {
  it("renders FacultyContactSection with contact picker, phone, email, qualification, and specialization pills", () => {
    const html = renderToStaticMarkup(
      <FacultyContactSection
        facultyDraft={{ contactId: "cnt-1" }}
        linkedContact={{
          id: "cnt-1",
          name: "Ustadh Ali",
          phones: [{ number: "+923001234567" }],
          emails: [{ address: "ali@madrasa.org" }],
          education: [{ degree: "M.A. Islamic Studies", fieldOfStudy: "Hadith" }],
        } as any}
        linkedFacultyContactIds={[]}
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

  it("renders FacultyBasicSection as null (retired in favor of contact education/skills)", () => {
    const html = renderToStaticMarkup(
      <FacultyBasicSection
        facultyDraft={{ specialization: "Tajweed" }}
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

  it("renders FacultyEmploymentSection employeeId, status, and join date fields", () => {
    const html = renderToStaticMarkup(
      <FacultyEmploymentSection
        autoGenerateId={false}
        errors={{}}
        fields={{}}
        idPrefix="FAC-"
        nextEmployeeId="FAC-002"
        statusOptions={[{ value: "active", label: "Active" }]}
        facultyDraft={{ employeeId: "FAC-001", status: "active" }}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.form.sectionEmployment");
    expect(html).toContain("FAC-001");
  });

  it("renders accessible error attributes on employeeId when errors are present", () => {
    const empHtml = renderToStaticMarkup(
      <FacultyEmploymentSection
        autoGenerateId={false}
        errors={{ employeeId: "Duplicate employee ID" }}
        fields={{}}
        idPrefix="FAC-"
        statusOptions={[{ value: "active", label: "Active" }]}
        facultyDraft={{ employeeId: "FAC-001", status: "active" }}
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

  it("renders designation and dynamic department dropdown in designation section", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        errors={{}}
        facultyDraft={{
          designationId: "senior-faculty",
          designationStartsOn: "2026-01-01",
          department: "Islamic Jurisprudence",
        }}
        designationOptions={[{
          id: "senior-faculty",
          code: "SENIOR",
          name: "Senior Faculty",
          hierarchyRank: 3,
          isActive: true,
          assignableRoles: ["faculty_member"],
        }]}
        departmentOptions={["Islamic Jurisprudence", "Hifz"]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="designationId"');
    expect(html).not.toContain('type="date"');
    expect(html).toContain('id="designationStartsOn"');
    expect(html).toContain('id="department"');
    expect(html).toContain('value="Islamic Jurisprudence"');
  });

  it("renders hierarchy rank and supervisor picker in hierarchy section", () => {
    const html = renderToStaticMarkup(
      <FacultyFormHierarchySection
        errors={{}}
        facultyDraft={{
          hierarchyRank: 3,
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
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="hierarchyRank"');
    expect(html).toContain('id="reportingFacultyId"');
    expect(html).toContain("Dean Ahmad");
    expect(html).toContain("Rank 1");
  });

  it("omits department, specialization, and qualification from employment section", () => {
    const html = renderToStaticMarkup(
      <FacultyEmploymentSection
        autoGenerateId={false}
        errors={{}}
        fields={{}}
        idPrefix="FAC-"
        statusOptions={[{ value: "active", label: "Active" }]}
        facultyDraft={{ employeeId: "FAC-001", status: "active" }}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).not.toContain('id="department"');
    expect(html).not.toContain('id="specialization"');
    expect(html).not.toContain('id="qualification"');
  });
});
