import { describe, expect, it, vi } from "vitest";
import { buildFacultyWorkFilterChips } from "./buildFacultyWorkFilterChips";

const mockT = ((key: string) => key) as never;

describe("buildFacultyWorkFilterChips", () => {
  it("builds status, specialization, and gender filter chips", () => {
    const onToggleStatus = vi.fn();
    const onSpecializationChange = vi.fn();
    const onGenderChange = vi.fn();

    const chips = buildFacultyWorkFilterChips({
      filterStatus: ["active"],
      filterSpecialization: "Tajweed",
      filterGender: "male",
      onToggleStatus,
      onSpecializationChange,
      onGenderChange,
      t: mockT,
    });

    expect(chips.some((c) => c.key === "active")).toBe(true);
    expect(chips.some((c) => c.key === "specialization")).toBe(true);
    expect(chips.some((c) => c.key === "gender")).toBe(true);
  });

  it("builds department and designation filter chips when provided", () => {
    const onDepartmentChange = vi.fn();
    const onDesignationChange = vi.fn();

    const chips = buildFacultyWorkFilterChips({
      filterStatus: [],
      filterSpecialization: "",
      filterGender: "",
      filterDepartment: "Academics",
      filterDesignation: "Dean",
      onToggleStatus: vi.fn(),
      onSpecializationChange: vi.fn(),
      onGenderChange: vi.fn(),
      onDepartmentChange,
      onDesignationChange,
      t: mockT,
    });

    const deptChip = chips.find((c) => c.key === "department");
    expect(deptChip).toBeDefined();
    expect(deptChip?.label).toBe("Academics");
    deptChip?.onRemove();
    expect(onDepartmentChange).toHaveBeenCalledWith("");

    const desigChip = chips.find((c) => c.key === "designation");
    expect(desigChip).toBeDefined();
    expect(desigChip?.label).toBe("Dean");
    desigChip?.onRemove();
    expect(onDesignationChange).toHaveBeenCalledWith("");
  });
});
