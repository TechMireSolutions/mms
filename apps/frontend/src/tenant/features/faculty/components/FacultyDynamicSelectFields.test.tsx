import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyDesignationSelectField } from "./FacultyDesignationSelectField";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyDynamicSelectFields", () => {
  it("renders department field with Add button and options", () => {
    const html = renderToStaticMarkup(
      <FacultyDepartmentSelectField
        value=""
        departmentEntities={[
          {
            id: "dept-1",
            workspaceSubdomain: "demo",
            name: "Hifz",
            code: "HIFZ",
            parentId: null,
            headFacultyId: null,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain("faculty.setup.addDepartmentSubtitle");
    expect(html).toContain("common.add");
    expect(html).toContain("Hifz (HIFZ)");
  });

  it("renders department edit and delete action buttons when department is selected", () => {
    const html = renderToStaticMarkup(
      <FacultyDepartmentSelectField
        value="Hifz"
        departmentId="dept-1"
        departmentEntities={[
          {
            id: "dept-1",
            workspaceSubdomain: "demo",
            name: "Hifz",
            code: "HIFZ",
            parentId: null,
            headFacultyId: null,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('title="common.edit"');
    expect(html).toContain('title="common.delete"');
  });

  it("renders designation field with Add button and active options", () => {
    const html = renderToStaticMarkup(
      <FacultyDesignationSelectField
        designationOptions={[
          {
            id: "des-1",
            code: "PRIN",
            name: "Principal",
            hierarchyRank: 1,
            isActive: true,
            assignableRoles: ["admin"],
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="designationId"');
    expect(html).toContain("faculty.designations.addDesignation");
    expect(html).toContain("common.add");
    expect(html).toContain("Principal");
  });

  it("renders designation edit and delete action buttons when designation is selected", () => {
    const html = renderToStaticMarkup(
      <FacultyDesignationSelectField
        designationId="des-1"
        designationOptions={[
          {
            id: "des-1",
            code: "PRIN",
            name: "Principal",
            hierarchyRank: 1,
            isActive: true,
            assignableRoles: ["admin"],
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('title="common.edit"');
    expect(html).toContain('title="common.delete"');
  });
});
