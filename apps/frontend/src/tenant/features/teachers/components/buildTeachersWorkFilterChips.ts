import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { teacherStatusLabel } from "@/lib/teachers/teacherStatusUi";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { buildWorkFilterChips, type WorkFilterChip } from "@/lib/query/buildWorkFilterChips";

export type TeachersWorkFilterChip = WorkFilterChip;

/** Build removable FilterChips models for active Teachers Work filters. */
export function buildTeachersWorkFilterChips(input: {
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  t: TranslationFunction;
}): TeachersWorkFilterChip[] {
  return buildWorkFilterChips({
    statuses: input.filterStatus,
    statusLabel: teacherStatusLabel,
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
