import React from "react";
import { Download, Eye, EyeOff, Plus } from "lucide-react";
import { type AppTranslationKey } from "@mms/shared";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/data/accountingData";

interface ChartOfAccountsToolbarProps {
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

export function ChartOfAccountsToolbar({
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
}: ChartOfAccountsToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("accounting.coa.controlsAria")} className="flex flex-wrap gap-2 items-center">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("accounting.coa.searchAccounts")}
        className="flex-1 min-w-search"
      />
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
      />
      <Button
        type="button"
        variant={showInactive ? "secondary" : "outline"}
        aria-pressed={showInactive}
        onClick={() => setShowInactive(!showInactive)}
        className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
      >
        {showInactive ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
        {showInactive ? t("accounting.coa.showingAll") : t("accounting.coa.showInactive")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onExportCsv}
        className="flex items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
      </Button>
      {columnCustomizer && (
        <ModuleColumnCustomizer
          columnRegistry={columnCustomizer.columnRegistry}
          updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
          labels={columnCustomizer.labels}
        />
      )}
      {canWrite && (
        <Button
          type="button"
          variant="default"
          onClick={onAddAccount}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold ms-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.coa.addAccount")}
        </Button>
      )}
    </nav>
  );
}
