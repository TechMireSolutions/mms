import React from "react";
import { Download, Eye, EyeOff, Plus } from "lucide-react";
import { type AppTranslationKey } from "@mms/shared";
import { FormSelect } from "@/components/ui/FormSelect";
import { type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleWorkToolbar } from "@/components/ui/ModuleWorkToolbar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/data/accountingData";

interface ChartOfAccountsListFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  typeFilter: AccountType | "all";
  setTypeFilter: (typeFilter: AccountType | "all") => void;
  showInactive: boolean;
  setShowInactive: (showInactive: boolean) => void;
  onExportCsv: () => void;
  onAddAccount: () => void;
  canWrite: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function ChartOfAccountsListFilters({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  showInactive,
  setShowInactive,
  onExportCsv,
  onAddAccount,
  canWrite,
  columnCustomizer,
}: ChartOfAccountsListFiltersProps): React.JSX.Element {
  const { t } = useTranslation();
  const hasActiveFilters = typeFilter !== "all" || showInactive;
  const handleClearFilters = (): void => {
    setTypeFilter("all");
    setShowInactive(false);
  };

  return (
    <ModuleWorkToolbar
      regionLabel={t("accounting.coa.controlsAria")}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("accounting.coa.searchAccounts")}
      searchId="coa-search"
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      clearFiltersLabel={t("accounting.clearFilters")}
      primaryAction={
        canWrite ? (
          <Button
            type="button"
            variant="default"
            onClick={onAddAccount}
            className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.coa.addAccount")}
          </Button>
        ) : undefined
      }
      columnCustomizer={columnCustomizer ? {
        registry: columnCustomizer.columnRegistry,
        onUpdate: columnCustomizer.updateUserColumnLayout,
        onReset: columnCustomizer.onResetLayout,
        labels: columnCustomizer.labels,
      } : undefined}
    >
      <div className="flex-shrink-0 min-w-filter-xl">
        <FormSelect
          aria-label={t("accounting.coa.filterTypeAria")}
          value={typeFilter}
          onChange={(accountTypeValue) => setTypeFilter(accountTypeValue as AccountType | "all")}
          options={[
            { value: "all", label: t("accounting.ledger.allTypes") },
            ...ACCOUNT_TYPES.map((type) => ({
              value: type,
              label: t(`accounting.type.${type}` as AppTranslationKey),
            })),
          ]}
          className="min-h-11 rounded-xl"
        />
      </div>
      <Button
        type="button"
        variant={showInactive ? "secondary" : "outline"}
        aria-pressed={showInactive}
        onClick={() => setShowInactive(!showInactive)}
        className="flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold"
      >
        {showInactive ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
        {showInactive ? t("accounting.coa.showingAll") : t("accounting.coa.showInactive")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onExportCsv}
        className="flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
      </Button>
    </ModuleWorkToolbar>
  );
}
