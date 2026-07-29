import type { ComponentType } from "react";
import { MessageCircle, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppTranslationKey, ContactsQuickFilter } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

const QUICK_FILTER_PRESETS: Array<{
  id: ContactsQuickFilter;
  labelKey: AppTranslationKey;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "all", labelKey: "contacts.filtersAll", icon: Users },
  { id: "whatsapp", labelKey: "contacts.filtersWhatsApp", icon: MessageCircle },
  { id: "syed", labelKey: "contacts.filtersSyed", icon: CheckCircle2 },
  { id: "missingInfo", labelKey: "contacts.filtersMissingInfo", icon: AlertCircle },
];

export interface ContactsQuickFilterBarProps {
  quickFilter: ContactsQuickFilter;
  onQuickFilterChange: (preset: ContactsQuickFilter) => void;
}

export function ContactsQuickFilterBar({
  quickFilter,
  onQuickFilterChange,
}: ContactsQuickFilterBarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {QUICK_FILTER_PRESETS.map((preset) => {
        const Icon = preset.icon;
        const isSelected = quickFilter === preset.id;
        return (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            onClick={() => onQuickFilterChange(preset.id)}
            aria-pressed={isSelected}
            className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap shadow-none ${
              isSelected
                ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs hover:bg-primary/15 hover:text-primary"
                : "bg-card/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-card/80"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
            <span>{t(preset.labelKey)}</span>
          </Button>
        );
      })}
    </div>
  );
}
