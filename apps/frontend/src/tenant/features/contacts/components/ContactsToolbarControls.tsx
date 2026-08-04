import { RefreshCw } from "lucide-react";
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
