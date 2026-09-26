import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyFormHierarchySection } from "./FacultyFormHierarchySection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyFormHierarchySection", () => {
  it("returns null when hierarchyRank and reportingFacultyId are disabled", () => {
    const html = renderToStaticMarkup(
      <FacultyFormHierarchySection
        teacherDraft={{}}
        errors={{}}
        isFieldEnabled={() => false}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });

  it("renders rank selector and supervisor options", () => {
    const html = renderToStaticMarkup(
      <FacultyFormHierarchySection
        teacherDraft={{
          hierarchyRank: 3,
          reportingFacultyId: "fac-sup",
        }}
        errors={{}}
        supervisorCandidates={[
          {
            id: "fac-sup",
            contactId: "cnt-sup",
            name: "Dean Qasim",
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

    expect(html).toContain("faculty.form.tab.hierarchy");
    expect(html).toContain('id="hierarchyRank"');
    expect(html).toContain('id="reportingFacultyId"');
    expect(html).toContain("Dean Qasim");
    expect(html).toContain("Rank 1");
  });

  it("shows top level notice and disables supervisor select when hierarchyRank is 1", () => {
    const html = renderToStaticMarkup(
      <FacultyFormHierarchySection
        teacherDraft={{
          hierarchyRank: 1,
        }}
        errors={{}}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.form.topLevelRankNotice");
  });
});
