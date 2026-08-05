import type { JSX } from "react";
import { RefreshCw } from "lucide-react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export { ContactsFilterMenuButton } from "@/tenant/features/contacts/components/ContactsFilterMenuButton";

export function ContactsClearFiltersButton({
  onClearFilters,
  t,
}: {
  onClearFilters: () => void;
  t: TranslationFunction;
}): JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClearFilters}
      className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE)}
    >
      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{t("contacts.clearFilters")}</span>
    </Button>
  );
}
