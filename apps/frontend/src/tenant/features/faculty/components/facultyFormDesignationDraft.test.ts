import { describe, expect, it } from "vitest";
import {
  getInitialDesignationRows,
  syncPrimaryDesignationPatch,
  toDesignationHoldings,
} from "./facultyFormDesignationDraft";

describe("facultyFormDesignationDraft", () => {
  it("seeds one active row from legacy designationId and department", () => {
    const rows = getInitialDesignationRows({
      designationId: "des-1",
      department: "Hadith",
      departmentId: "dept-1",
      designationStartsOn: "2026-01-01",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.designationId).toBe("des-1");
    expect(rows[0]?.departmentId).toBe("dept-1");
    expect(rows[0]?.department).toBe("Hadith");
    expect(rows[0]?.status).toBe("active");
    expect(rows[0]?.startsOn).toBe("2026-01-01");
  });

  it("maps multiple rows and marks the first active holding as primary", () => {
    const holdings = toDesignationHoldings([
      {
        key: "a",
        department: "A",
        departmentId: "dept-a",
        designationId: "des-1",
        positionId: "",
        status: "inactive",
        startsOn: "2026-01-01",
        endsOn: "",
      },
      {
        key: "b",
        department: "B",
        departmentId: "dept-b",
        designationId: "des-2",
        positionId: "pos-2",
        status: "active",
        startsOn: "2026-02-01",
        endsOn: "",
      },
      {
        key: "c",
        department: "C",
        departmentId: "dept-c",
        designationId: "des-3",
        positionId: "",
        status: "active",
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
      },
    ]);
    expect(holdings).toEqual([
      {
        designationId: "des-1",
        departmentId: "dept-a",
        status: "inactive",
        startsOn: "2026-01-01",
        endsOn: null,
        isPrimary: false,
      },
      {
        designationId: "des-2",
        departmentId: "dept-b",
        positionId: "pos-2",
        status: "active",
        startsOn: "2026-02-01",
        endsOn: null,
        isPrimary: true,
      },
      {
        designationId: "des-3",
        departmentId: "dept-c",
        status: "active",
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
        isPrimary: false,
      },
    ]);
  });

  it("syncs singular designation fields from the primary active row", () => {
    const patch = syncPrimaryDesignationPatch(
      [
        {
          key: "a",
          department: "Fiqh",
          departmentId: "dept-1",
          designationId: "des-1",
          positionId: "pos-1",
          status: "active",
          startsOn: "2026-01-01",
          endsOn: "",
        },
        {
          key: "b",
          department: "Hadith",
          departmentId: "dept-2",
          designationId: "des-2",
          positionId: "",
          status: "inactive",
          startsOn: "2026-02-01",
          endsOn: "",
        },
      ],
      {
        designationOptions: [
          { id: "des-1", name: "Principal", assignableRoles: ["admin"] },
          { id: "des-2", name: "Lecturer", assignableRoles: ["instructor"] },
        ],
      },
    );
    expect(patch.designationId).toBe("des-1");
    expect(patch.designation).toBe("Principal");
    expect(patch.departmentId).toBe("dept-1");
    expect(patch.department).toBe("Fiqh");
    expect(patch.positionId).toBe("pos-1");
    expect(patch.designationAssignableRoles).toEqual(["admin"]);
    expect(patch.designations).toHaveLength(2);
  });

  it("skips rows missing departmentId or designationId", () => {
    expect(
      toDesignationHoldings([
        {
          key: "a",
          department: "",
          departmentId: "",
          designationId: "des-1",
          positionId: "",
          status: "active",
          startsOn: "2026-01-01",
          endsOn: "",
        },
      ]),
    ).toEqual([]);
  });
});
