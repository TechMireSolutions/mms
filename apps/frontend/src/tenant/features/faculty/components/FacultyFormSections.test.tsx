import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FacultyBasicSection,
  FacultyContactSection,
  FacultyEmploymentSection,
} from "./FacultyFormSections";
import { FacultyFormDesignationSection } from "./FacultyFormDesignationSection";

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: () => <div data-testid="contact-picker">contact-picker</div>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./FacultyCatalogCreateOverlays", () => ({
  FacultyCatalogCreateOverlays: () => null,
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

  it("renders designation holding card with department, designation, and dates", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        errors={{}}
        facultyDraft={{
          designationId: "senior-faculty",
          designationStartsOn: "2026-01-01",
          department: "Islamic Jurisprudence",
          departmentId: "dept-1",
          designations: [{
            designationId: "senior-faculty",
            departmentId: "dept-1",
            departmentName: "Islamic Jurisprudence",
            status: "active",
            startsOn: "2026-01-01",
            isPrimary: true,
          }],
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

    expect(html).toContain("faculty.field.department");
    expect(html).toContain("faculty.designations.startsOn");
    expect(html).toContain("faculty.designations.holdingStatus");
    expect(html).not.toContain('type="date"');
    expect(html).toContain('value="Islamic Jurisprudence"');
    expect(html).toContain("faculty.designations.addDesignation");
    expect(html).not.toContain("faculty.form.tab.designation");
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
