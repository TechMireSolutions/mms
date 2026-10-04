import { describe, expect, it } from "vitest";
import {
  FACULTY_WORK_SUB_TAB_DEFAULT,
  FACULTY_WORK_SUB_TAB_IDS,
  resolveFacultyWorkSubTab,
} from "./facultyPageWorkSubTabs";

describe("facultyPageWorkSubTabs", () => {
  it("keeps known sub-tab ids and defaults unknown values", () => {
    expect(FACULTY_WORK_SUB_TAB_IDS).toEqual(["faculties", "departments", "designations"]);
    expect(resolveFacultyWorkSubTab("departments")).toBe("departments");
    expect(resolveFacultyWorkSubTab("nope")).toBe(FACULTY_WORK_SUB_TAB_DEFAULT);
  });
});
