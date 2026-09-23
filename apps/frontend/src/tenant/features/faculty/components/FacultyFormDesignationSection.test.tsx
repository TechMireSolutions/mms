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
        teacherDraft={{}}
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
        teacherDraft={{
          designationId: "des-1",
          designationStartsOn: "2026-01-01",
        }}
        errors={{}}
        designationOptions={[
          {
            id: "des-1",
            code: "HEAD",
            name: "Head Teacher",
            hierarchyRank: 2,
            isActive: true,
            assignableRoles: ["teacher", "department_head"],
          },
        ]}
        isFieldEnabled={() => true}
        isFieldRequired={() => true}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.form.tab.designation");
    expect(html).toContain('id="designationId"');
    expect(html).toContain("Head Teacher");
    expect(html).toContain("department_head");
    expect(html).toContain("designationStartsOn");
  });

  it("disables designation select and shows history notice for existing faculty member", () => {
    const html = renderToStaticMarkup(
      <FacultyFormDesignationSection
        teacher={{ id: "fac-1", contactId: "cnt-1", status: "active" } as any}
        teacherDraft={{ designationId: "des-1" }}
        errors={{}}
        designationOptions={[
          {
            id: "des-1",
            code: "HEAD",
            name: "Head Teacher",
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
});
