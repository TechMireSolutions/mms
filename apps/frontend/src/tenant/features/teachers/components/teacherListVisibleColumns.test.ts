import { describe, expect, it } from "vitest";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import {
  buildTeacherCustomFieldsById,
  getTeacherVisibleWorkColumns,
  teacherWorkColumnCellClass,
  teacherWorkColumnHeadClass,
  toTeacherListSortField,
} from "./teacherListVisibleColumns";

const mockRegistry: ModuleColumnRegistryEntry[] = [
  { key: "name", label: "Name", enabled: true, fixed: true, order: 0 },
  { key: "employeeId", label: "Employee ID", enabled: true, fixed: false, order: 1 },
  { key: "gender", label: "Gender", enabled: true, fixed: false, order: 2 },
  { key: "phone", label: "Phone", enabled: true, fixed: false, order: 3 },
  { key: "specialization", label: "Specialization", enabled: true, fixed: false, order: 4 },
  { key: "custom:certification", label: "Certification", enabled: true, fixed: false, order: 5 },
  { key: "archived", label: "Archived", enabled: false, fixed: false, order: 6 },
];

describe("getTeacherVisibleWorkColumns", () => {
  it("filters visible columns in registry order", () => {
    const isVisible = (key: string) => key !== "phone" && key !== "archived";
    const result = getTeacherVisibleWorkColumns(mockRegistry, isVisible);

    expect(result.map((col) => col.key)).toEqual([
      "name",
      "employeeId",
      "gender",
      "specialization",
      "custom:certification",
    ]);
  });

  it("excludes face columns when excludeFace is true", () => {
    const isVisible = () => true;
    const result = getTeacherVisibleWorkColumns(mockRegistry, isVisible, { excludeFace: true });

    expect(result.map((col) => col.key)).toEqual([
      "employeeId",
      "gender",
      "phone",
      "specialization",
      "custom:certification",
      "archived",
    ]);
  });
});

describe("toTeacherListSortField", () => {
  it("returns sort field for valid sortable columns", () => {
    expect(toTeacherListSortField("name")).toBe("name");
    expect(toTeacherListSortField("employeeId")).toBe("employeeId");
    expect(toTeacherListSortField("joinDate")).toBe("joinDate");
  });

  it("returns null for non-sortable columns", () => {
    expect(toTeacherListSortField("custom:certification")).toBeNull();
    expect(toTeacherListSortField("unknown_column")).toBeNull();
  });
});

describe("buildTeacherCustomFieldsById", () => {
  it("builds map for custom:* columns", () => {
    const map = buildTeacherCustomFieldsById(mockRegistry);

    expect(map.size).toBe(1);
    expect(map.get("certification")).toEqual({
      id: "certification",
      label: "Certification",
    });
  });
});

describe("teacherWorkColumn responsive classes", () => {
  it("applies responsive breakpoint classes to specialization and custom columns", () => {
    expect(teacherWorkColumnCellClass("specialization")).toContain("hidden sm:table-cell");
    expect(teacherWorkColumnHeadClass("specialization")).toContain("hidden sm:table-cell");
    expect(teacherWorkColumnCellClass("qualification")).toContain("hidden md:table-cell");
    expect(teacherWorkColumnCellClass("custom:certification")).toContain("hidden lg:table-cell");
  });

  it("applies default class for primary columns", () => {
    expect(teacherWorkColumnCellClass("name")).toBe("px-4 py-3");
    expect(teacherWorkColumnHeadClass("name")).toBe("px-4 py-3 text-start");
  });
});
