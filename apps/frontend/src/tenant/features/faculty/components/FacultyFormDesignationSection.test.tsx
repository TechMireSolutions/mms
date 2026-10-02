import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyFormDesignationSection } from "./FacultyFormDesignationSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyFormDesignationSection", () => {
  it("returns null when designation field is disabled", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{}}
        errors={{}}
        isFieldEnabled={() => false}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });

  it("renders designation dropdown and start date for a new faculty member", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{
          designationId: "des-1",
          designationStartsOn: "2026-01-01",
        }}
        errors={{}}
        designationOptions={[
          {
            id: "des-1",
            code: "HEAD",
            name: "Head of Department",
            hierarchyRank: 2,
            isActive: true,
            assignableRoles: ["instructor", "department_head"],
          },
        ]}
        isFieldEnabled={() => true}
        isFieldRequired={() => true}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.form.tab.designation");
    expect(html).toContain('id="designationId"');
    expect(html).toContain("Head of Department");
    expect(html).toContain("department_head");
    expect(html).toContain("designationStartsOn");
  });

  it("disables designation select and shows history notice for existing faculty member", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        faculty={{ id: "fac-1", contactId: "cnt-1", status: "active" } as any}
        facultyDraft={{ designationId: "des-1" }}
        errors={{}}
        designationOptions={[
          {
            id: "des-1",
            code: "HEAD",
            name: "Head of Department",
            hierarchyRank: 2,
            isActive: true,
            assignableRoles: [],
          },
        ]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.designations.manageInHistory");
    expect(html).not.toContain("designationStartsOn");
  });

  it("renders department select when department field is enabled", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{
          department: "Islamic Jurisprudence",
        }}
        errors={{}}
        departmentOptions={["Islamic Jurisprudence", "Hifz"]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain('value="Islamic Jurisprudence"');
    expect(html).not.toContain('id="reportingFacultyId"');
  });

  it("renders department entities with code when departmentEntities is provided", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{ department: "Hadith Sciences" }}
        errors={{}}
        departmentEntities={[
          {
            id: "dept-1",
            workspaceSubdomain: "tenant",
            name: "Hadith Sciences",
            code: "hadith",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            deletedAt: null,
            parentId: null,
            headFacultyId: null,
          },
        ]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain("Hadith Sciences (hadith)");
  });

  it("renders department first, designation second, reporting designation selector, and start/end dates", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{
          department: "Tafseer",
          designationId: "des-prof",
          designationStartsOn: "2026-01-01",
          designationEndsOn: "2026-12-31",
          reportingFacultyId: "fac-dean",
        }}
        errors={{}}
        departmentOptions={["Tafseer", "Hadith"]}
        designationOptions={[
          {
            id: "des-prof",
            code: "PROF",
            name: "Professor",
            hierarchyRank: 2,
            isActive: true,
            assignableRoles: ["academic_lead"],
          },
        ]}
        supervisorCandidates={[
          {
            id: "fac-dean",
            contactId: "cnt-dean",
            name: "Dean Qasim",
            hierarchyRank: 1,
            designation: "Dean of Faculty",
            status: "active",
          } as any,
        ]}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    // Verify ordering: Department is first, Designation is second
    const deptIdx = html.indexOf('id="department"');
    const desIdx = html.indexOf('id="designationId"');
    const supIdx = html.indexOf('id="reportingFacultyId"');
    const startIdx = html.indexOf('id="designationStartsOn"');
    const endIdx = html.indexOf('id="designationEndsOn"');

    expect(deptIdx).toBeGreaterThan(-1);
    expect(desIdx).toBeGreaterThan(deptIdx);
    expect(supIdx).toBeGreaterThan(desIdx);
    expect(startIdx).toBeGreaterThan(supIdx);
    expect(endIdx).toBeGreaterThan(startIdx);

    // Verify reporting designation / supervisor selector content
    expect(html).toContain("Dean Qasim");
    expect(html).toContain("Dean of Faculty");
    expect(html).toContain("Rank 1");

    // Verify end date value is bound
    expect(html).toContain('value="2026-12-31"');
  });
});
