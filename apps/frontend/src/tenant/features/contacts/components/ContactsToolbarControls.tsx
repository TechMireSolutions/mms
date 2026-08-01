import { Archive, RefreshCw } from "lucide-react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Button } from "@/components/ui/button";

export { ContactsFilterMenuButton } from "@/tenant/features/contacts/components/ContactsFilterMenuButton";

export function ContactsClearFiltersButton({
  onClearFilters,
  t,
}: {
  onClearFilters: () => void;
  t: TranslationFunction;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClearFilters}
      className="flex items-center gap-1.5 px-3 min-h-11 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{t("contacts.clearFilters")}</span>
    </Button>
  );
}

export function ContactsDeletedToggleButton({
  showDeletedArchives,
  onShowDeletedChange,
  t,
}: {
  showDeletedArchives: boolean;
  onShowDeletedChange: (show: boolean) => void;
  t: TranslationFunction;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onShowDeletedChange(!showDeletedArchives)}
      aria-pressed={showDeletedArchives}
      className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
        showDeletedArchives
          ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      <Archive className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{showDeletedArchives ? t("contacts.showActive") : t("contacts.showDeleted")}</span>
    </Button>
  );
}
