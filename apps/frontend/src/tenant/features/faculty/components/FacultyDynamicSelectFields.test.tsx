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
  it("renders dynamic department dropdown without add/edit/delete buttons", () => {
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
            isActive: true,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="department"');
    expect(html).toContain("Hifz (HIFZ)");
    expect(html).not.toContain("common.add");
    expect(html).not.toContain("faculty.setup.addDepartmentSubtitle");
  });

  it("omits inactive departments unless they are the current selection", () => {
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
            isActive: true,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          {
            id: "dept-2",
            workspaceSubdomain: "demo",
            name: "Archived Dept",
            code: "ARCH",
            parentId: null,
            isActive: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(html).toContain("Hifz (HIFZ)");
    expect(html).not.toContain("Archived Dept");
  });

  it("does not render edit or delete buttons even when department is selected", () => {
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
            isActive: true,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).not.toContain('title="common.edit"');
    expect(html).not.toContain('title="common.delete"');
  });

  it("renders designation dropdown without add/edit/delete buttons and lists all active options", () => {
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
          {
            id: "des-2",
            code: "LECT",
            name: "Lecturer",
            hierarchyRank: 4,
            isActive: true,
            assignableRoles: ["instructor"],
          },
          {
            id: "des-3",
            code: "ARCH",
            name: "Archived Title",
            hierarchyRank: 5,
            isActive: false,
            assignableRoles: [],
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('id="designationId"');
    expect(html).toContain("Principal");
    expect(html).toContain("Lecturer");
    expect(html).not.toContain("Archived Title");
    expect(html).not.toContain("faculty.designations.addDesignation");
    expect(html).not.toContain("common.add");
    expect(html).not.toContain('title="common.edit"');
    expect(html).not.toContain('title="common.delete"');
  });

  it("keeps the currently selected inactive designation available in the list", () => {
    const html = renderToStaticMarkup(
      <FacultyDesignationSelectField
        designationId="des-3"
        designationOptions={[
          {
            id: "des-3",
            code: "ARCH",
            name: "Archived Title",
            hierarchyRank: 5,
            isActive: false,
            assignableRoles: [],
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain("Archived Title");
    expect(html).not.toContain("common.add");
    expect(html).not.toContain('title="common.edit"');
    expect(html).not.toContain('title="common.delete"');
  });
});
