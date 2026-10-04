import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyFormDesignationSection } from "./FacultyFormDesignationSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./FacultyCatalogCreateOverlays", () => ({
  FacultyCatalogCreateOverlays: () => null,
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

  it("omits collection title in tab mode and puts status in the row header", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{
          department: "Islamic Jurisprudence",
          departmentId: "dept-1",
          designationId: "des-1",
          designationStartsOn: "2026-01-01",
          designationEndsOn: "2026-12-31",
          designations: [{
            designationId: "des-1",
            departmentId: "dept-1",
            departmentName: "Islamic Jurisprudence",
            status: "active",
            startsOn: "2026-01-01",
            endsOn: "2026-12-31",
            isPrimary: true,
          }],
        }}
        errors={{}}
        departmentEntities={[
          {
            id: "dept-1",
            workspaceSubdomain: "tenant",
            name: "Islamic Jurisprudence",
            code: "fiqh",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            deletedAt: null,
            parentId: null,
            isActive: true,
          },
        ]}
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

    expect(html).not.toContain("<h3");
    expect(html).not.toContain("faculty.form.tab.designation");
    expect(html).toContain("faculty.designations.holdingStatus");
    expect(html).toContain("faculty.designations.startsOn");
    expect(html).toContain("faculty.designations.endsOn");
    expect(html).toContain("faculty.designations.addDesignation");
    expect(html).toContain("border-dashed");
    expect(html).toContain("Head of Department");
    expect(html).toMatch(/id="designation-status-/);
    expect(html).not.toMatch(/faculty\.field\.designation \d/);
    expect(html).toContain('aria-label="faculty.setup.addDepartment"');
    expect(html).toContain('aria-label="faculty.designations.addDesignation"');
  });

  it("shows collection title only when showCollectionTitle is set", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        showCollectionTitle
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

    expect(html).toContain("faculty.form.tab.designation");
  });

  it("disables designation editing and shows history notice for existing faculty member", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        faculty={{ id: "fac-1", contactId: "cnt-1", status: "active" } as never}
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
    expect(html).not.toContain("faculty.designations.addDesignation");
    expect(html).not.toContain("border-dashed");
  });

  it("renders department-only select when designation field is disabled", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        facultyDraft={{
          department: "Islamic Jurisprudence",
        }}
        errors={{}}
        departmentOptions={["Islamic Jurisprudence", "Hifz"]}
        isFieldEnabled={(fieldId) => fieldId === "department" || fieldId === "departmentId"}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain('value="Islamic Jurisprudence"');
    expect(html).not.toContain("faculty.designations.addDesignation");
  });
});
