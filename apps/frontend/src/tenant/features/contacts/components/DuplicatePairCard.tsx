import { GitMerge, X } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  ConfidenceBadge,
  DuplicateContactCard,
  type DuplicatePair,
} from "@/tenant/features/contacts/components/DuplicateDetectionParts";

export function DuplicatePairCard({
  pair,
  prefs,
  selectedKeepIndex,
  canWrite,
  onMerge,
  onDismiss,
  onSelectKeep,
  t,
}: {
  pair: DuplicatePair;
  prefs: Partial<ContactPreferences>;
  selectedKeepIndex: number;
  canWrite: boolean;
  onMerge: () => void;
  onDismiss: () => void;
  onSelectKeep: (contactIndex: number) => void;
  t: TranslationFunction;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ConfidenceBadge score={pair.confidence} prefs={prefs} />
          <span className="text-sm text-muted-foreground">{pair.reason}</span>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button
              type="button"
              onClick={onMerge}
              className="flex items-center gap-1.5 px-3 min-h-11 rounded-lg text-sm font-semibold"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>{t("contacts.duplicates.merge")}</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onDismiss}
            className="min-w-11 min-h-11 p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
            title={t("contacts.duplicates.dismiss")}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium">
          {t("contacts.duplicates.selectKeep")}
        </p>
        <div className="flex gap-3">
          {pair.contacts.map((contact, contactIndex) => (
            <DuplicateContactCard
              key={contact.id}
              contact={contact}
              label={
                contactIndex === 0
                  ? t("contacts.duplicates.contactA")
                  : t("contacts.duplicates.contactB")
              }
              selected={selectedKeepIndex === contactIndex}
              onSelect={() => onSelectKeep(contactIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
