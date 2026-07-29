import { Archive, LayoutGrid, RefreshCw, Table } from "lucide-react";
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
      className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" />
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
      className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
        showDeletedArchives
          ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      <Archive className="w-3.5 h-3.5" />
      <span>{showDeletedArchives ? t("contacts.showActive") : t("contacts.showDeleted")}</span>
    </Button>
  );
}

export function ContactsViewModeToggle({
  viewMode,
  onViewModeChange,
  t,
}: {
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  t: TranslationFunction;
}) {
  return (
    <div
      className="flex items-center p-0.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-xs"
      role="group"
      aria-label={t("contacts.viewMode.group")}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("table")}
        className={`min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("contacts.viewMode.table")}
      >
        <Table className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onViewModeChange("cards")}
        className={`min-h-11 min-w-11 h-11 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === "cards"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("contacts.viewMode.cards")}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
