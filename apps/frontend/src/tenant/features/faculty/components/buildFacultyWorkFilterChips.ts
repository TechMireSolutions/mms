import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { facultyStatusLabel } from "@/lib/faculty/facultyStatusUi";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { buildWorkFilterChips, type WorkFilterChip } from "@/lib/query/buildWorkFilterChips";

export type FacultyWorkFilterChip = WorkFilterChip;
export type TeachersWorkFilterChip = FacultyWorkFilterChip;

/** Build removable FilterChips models for active Faculty Work filters. */
export function buildFacultyWorkFilterChips(input: {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  filterDepartment?: string;
  filterDesignation?: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onDesignationChange?: (value: string) => void;
  t: TranslationFunction;
}): FacultyWorkFilterChip[] {
  return buildWorkFilterChips({
    statuses: input.filterStatus,
    statusLabel: facultyStatusLabel,
    onToggleStatus: input.onToggleStatus,
    t: input.t,
    extraChips: [
      ...(input.filterSpecialization
        ? [
            {
              key: "specialization",
              label: input.filterSpecialization,
              onRemove: () => input.onSpecializationChange(""),
            },
          ]
        : []),
      ...(input.filterDepartment && input.onDepartmentChange
        ? [
            {
              key: "department",
              label: input.filterDepartment,
              onRemove: () => input.onDepartmentChange?.(""),
            },
          ]
        : []),
      ...(input.filterDesignation && input.onDesignationChange
        ? [
            {
              key: "designation",
              label: input.filterDesignation,
              onRemove: () => input.onDesignationChange?.(""),
            },
          ]
        : []),
      ...(input.filterGender
        ? [
            {
              key: "gender",
              label: formatContactGenderLabel(input.filterGender, input.t),
              onRemove: () => input.onGenderChange(""),
            },
          ]
        : []),
    ],
  });
}

export const buildTeachersWorkFilterChips = buildFacultyWorkFilterChips;

