import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyTabIoToolbar } from "./FacultyTabIoToolbar";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyTabIoToolbar", () => {
  it("renders scoped import/export/add for the active entity", () => {
    const html = renderToStaticMarkup(
      <FacultyTabIoToolbar
        entity="faculties"
        canExport={true}
        canWrite={true}
        viewingDeleted={false}
        onExportEntity={vi.fn()}
        onImportEntity={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.io.export");
    expect(html).toContain("faculty.io.import");
    expect(html).toContain("action.addFaculty");
    expect(html).not.toContain("faculty.setup.addDepartment");
    expect(html).not.toContain("faculty.designations.addDesignation");
  });

  it("uses department add label for departments entity", () => {
    const html = renderToStaticMarkup(
      <FacultyTabIoToolbar
        entity="departments"
        canExport={true}
        canWrite={true}
        viewingDeleted={false}
        onExportEntity={vi.fn()}
        onImportEntity={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.setup.addDepartment");
    expect(html).not.toContain("action.addFaculty");
  });

  it("hides actions when viewingDeleted is true", () => {
    const html = renderToStaticMarkup(
      <FacultyTabIoToolbar
        entity="faculties"
        canExport={true}
        canWrite={true}
        viewingDeleted={true}
        onExportEntity={vi.fn()}
        onImportEntity={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });
});
