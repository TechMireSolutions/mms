import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { TRANSACTION_GROUP_COLORS, TRANSACTION_GROUPS, type QuickActionType } from "./simpleTransactionWizardTypes";

interface StepTypeSelectionProps {
  selected: QuickActionType | null;
  onSelect: (type: QuickActionType) => void;
}

export function StepTypeSelection({ selected, onSelect }: StepTypeSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <header className="text-center space-y-1 pb-2">
        <h3 className="text-lg font-bold text-foreground m-0">{t("accounting.journal.dashboard.whatHappened")}</h3>
        <p className="text-sm text-muted-foreground m-0">{t("accounting.journal.dashboard.subtitleSimple")}</p>
      </header>
      {TRANSACTION_GROUPS.map((group) => {
        const colors = TRANSACTION_GROUP_COLORS[group.color];
        const GroupIcon = group.icon;
        const translatedGroupName = t(group.groupKey);

        return (
          <article key={group.groupKey} className={`rounded-2xl border p-4 ${colors.card}`}>
            <header className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg border w-fit ${colors.header}`}>
              <GroupIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <SectionLabel as="h4" weight="bold" tracking="wide" tone="inherit" className="m-0">{translatedGroupName}</SectionLabel>
            </header>
            <nav aria-label={`Select ${translatedGroupName} transaction type`} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isSelected = selected?.id === item.id;

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    aria-pressed={isSelected}
                    onClick={() => onSelect({ ...item, groupKey: group.groupKey, color: group.color })}
                    className={`h-auto flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${isSelected ? colors.selected : `border-border bg-card hover:bg-muted/50 ${colors.item}`}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? colors.icon : "bg-muted text-muted-foreground"}`} aria-hidden="true">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{t(item.labelKey)}</span>
                  </Button>
                );
              })}
            </nav>
          </article>
        );
      })}
    </div>
  );
}
