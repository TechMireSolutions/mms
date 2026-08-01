import { Check } from "lucide-react";
import type { Contact, ContactPreferences } from "@mms/shared";
import { getDuplicateConfidenceBadgeStyle } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDuplicateFieldLabel,
  getDuplicateFieldValue,
} from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";

export {
  getDuplicateThemeColors,
  type DuplicatePair,
} from "@/tenant/features/contacts/components/duplicateDetectionTypes";
export { MergePreview } from "@/tenant/features/contacts/components/DuplicateMergePreview";

export function ConfidenceBadge({
  score,
  prefs,
}: {
  score: number;
  prefs: Partial<ContactPreferences>;
}): JSX.Element {
  const { t } = useTranslation();
  const { colorClass } = getDuplicateConfidenceBadgeStyle(score, prefs);
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", colorClass)}>
      {score}
      {t("contacts.duplicates.matchSuffix")}
    </span>
  );
}

export function DuplicateContactCard({
  contact,
  selected,
  onSelect,
  label,
}: {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  label: string;
}): JSX.Element {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-start ${
        selected ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {selected && <Check className="w-4 h-4 text-primary" />}
      </div>
      <div className="space-y-1.5">
        {fields.map((field) => (
          <div key={field} className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">
              {getDuplicateFieldLabel(field, t)}:
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {getDuplicateFieldValue(field, contact, t)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
