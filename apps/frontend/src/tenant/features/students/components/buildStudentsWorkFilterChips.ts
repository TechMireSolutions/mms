import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { buildWorkFilterChips, type WorkFilterChip } from "@/lib/query/buildWorkFilterChips";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";

/** Build removable FilterChips models for active Students Work filters. */
export function buildStudentsWorkFilterChips(input: {
  studentFilterStatus: string[];
  studentFilterGender: string;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  t: TranslationFunction;
}): WorkFilterChip[] {
  return buildWorkFilterChips({
    statuses: input.studentFilterStatus,
    statusLabel: studentStatusLabel,
    onToggleStatus: input.onToggleStatus,
    t: input.t,
    extraChip: input.studentFilterGender
      ? {
          key: "gender",
          label: formatContactGenderLabel(input.studentFilterGender, input.t),
          onRemove: () => input.onGenderChange(""),
        }
      : undefined,
  });
}
