import { teacherStatusLabel } from "@/lib/teachers/teacherStatusUi";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export type TeachersWorkFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/** Build removable FilterChips models for active Teachers Work filters. */
export function buildTeachersWorkFilterChips(input: {
  filterStatus: string[];
  filterSpecialization: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  t: TranslationFunction;
}): TeachersWorkFilterChip[] {
  const chips: TeachersWorkFilterChip[] = input.filterStatus.map((status) => ({
    key: status,
    label: teacherStatusLabel(input.t, status),
    onRemove: () => input.onToggleStatus(status),
  }));

  if (input.filterSpecialization) {
    chips.push({
      key: "specialization",
      label: input.filterSpecialization,
      onRemove: () => input.onSpecializationChange(""),
    });
  }

  return chips;
}
