import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";

export type StudentsWorkFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/** Build removable FilterChips models for active Students Work filters. */
export function buildStudentsWorkFilterChips(input: {
  studentFilterStatus: string[];
  studentFilterGender: string;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  t: TranslationFunction;
}): StudentsWorkFilterChip[] {
  const chips: StudentsWorkFilterChip[] = input.studentFilterStatus.map((status) => ({
    key: status,
    label: studentStatusLabel(input.t, status),
    onRemove: () => input.onToggleStatus(status),
  }));

  if (input.studentFilterGender) {
    chips.push({
      key: "gender",
      label: formatContactGenderLabel(input.studentFilterGender, input.t),
      onRemove: () => input.onGenderChange(""),
    });
  }

  return chips;
}
