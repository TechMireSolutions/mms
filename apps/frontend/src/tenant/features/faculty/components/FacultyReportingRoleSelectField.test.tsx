import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyReportingRoleSelectField } from "./FacultyReportingRoleSelectField";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FacultyReportingRoleSelectField", () => {
  it("renders reporting role select with designations and filters selected designation", () => {
    const html = renderToStaticMarkup(
      <FacultyReportingRoleSelectField
        facultyDraft={{
          designationId: "des-teach",
          designation: "Teacher",
        }}
        errors={{}}
        designationOptions={[
          {
            id: "des-teach",
            code: "TCH",
            name: "Teacher",
            hierarchyRank: 3,
            isActive: true,
            assignableRoles: [],
          },
          {
            id: "des-hod",
            code: "HOD",
            name: "Head of Department",
            hierarchyRank: 2,
            isActive: true,
            assignableRoles: [],
          },
        ]}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("faculty.form.reportingRole");
    expect(html).toContain('id="reportingFacultyId"');
    // None option
    expect(html).toContain("faculty.form.noSupervisor");
    // HoD option present
    expect(html).toContain('value="des-hod"');
    expect(html).toContain("Head of Department (Rank 2)");
    // Teacher option is filtered out
    expect(html).not.toContain('value="des-teach"');
  });

  it("disables select and shows notice when hierarchyRank is 1", () => {
    const html = renderToStaticMarkup(
      <FacultyReportingRoleSelectField
        facultyDraft={{
          hierarchyRank: 1,
        }}
        errors={{}}
        designationOptions={[]}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("faculty.form.topLevelRankNotice");
  });
});
