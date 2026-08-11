import { CONTACTS_QUICK_FILTER_OPTIONS, type ContactsQuickFilter } from "@mms/shared";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { WorkFilterChip } from "@/lib/query/buildWorkFilterChips";

type ContactsWorkFilterChip = WorkFilterChip;

/** Build removable FilterChips models for active Contacts Work filters (gender + quick filter). */
export function buildContactsWorkFilterChips(input: {
  filterGender: string;
  quickFilter: ContactsQuickFilter;
  onGenderChange: (value: string) => void;
  onQuickFilterChange: (value: ContactsQuickFilter) => void;
  t: TranslationFunction;
}): ContactsWorkFilterChip[] {
  const chips: ContactsWorkFilterChip[] = [];

  if (input.filterGender) {
    chips.push({
      key: "gender",
      label: formatContactGenderLabel(input.filterGender, input.t),
      onRemove: () => input.onGenderChange(""),
    });
  }

  if (input.quickFilter !== "all") {
    const option = CONTACTS_QUICK_FILTER_OPTIONS.find(
      (preset) => preset.id === input.quickFilter,
    );
    if (option) {
      chips.push({
        key: "quickFilter",
        label: input.t(option.labelKey),
        onRemove: () => input.onQuickFilterChange("all"),
      });
    }
  }

  return chips;
}
