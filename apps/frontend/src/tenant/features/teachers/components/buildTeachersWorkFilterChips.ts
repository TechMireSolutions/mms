import { teacherStatusLabel } from "@/lib/teachers/teacherStatusUi";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { buildWorkFilterChips, type WorkFilterChip } from "@/lib/query/buildWorkFilterChips";

export type TeachersWorkFilterChip = WorkFilterChip;

/** Build removable FilterChips models for active Teachers Work filters. */
export function buildTeachersWorkFilterChips(input: {
  filterStatus: string[];
  filterSpecialization: string;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  t: TranslationFunction;
}): TeachersWorkFilterChip[] {
  return buildWorkFilterChips({
    statuses: input.filterStatus,
    statusLabel: teacherStatusLabel,
    onToggleStatus: input.onToggleStatus,
    t: input.t,
    extraChip: input.filterSpecialization
      ? {
          key: "specialization",
          label: input.filterSpecialization,
          onRemove: () => input.onSpecializationChange(""),
        }
      : undefined,
  });
}
