import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersFiltersMenuButton } from "./TeachersFiltersMenuButton";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  filterStatus: ["active"],
  filterSpecialization: "Tajweed",
  filterGender: "male",
  quickFilter: "all" as const,
  onQuickFilterChange: vi.fn(),
  genderFilters: ["male", "female"],
  statusOptions: ["active", "inactive"],
  specializationOptions: ["Tajweed", "Hadith"],
  activeFilterCount: 3,
  sortField: "name" as const,
  sortOptions: [{ field: "name" as const, label: "Name" }],
  onToggleStatus: vi.fn(),
  onSpecializationChange: vi.fn(),
  onGenderChange: vi.fn(),
  onSortChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("TeachersFiltersMenuButton Component", () => {
  it("renders filter menu button with active count badge", () => {
    const html = renderToStaticMarkup(<TeachersFiltersMenuButton {...defaultProps} />);

    expect(html).toContain("teachers.filters");
    expect(html).toContain("3");
  });
});
