import type React from "react";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { AppTranslationKey } from "@mms/shared";
import { InvoicesFilterMenuButton } from "@/tenant/features/finance/components/InvoicesFilterMenuButton";

export const FINANCE_INVOICES_WORK_SEARCH_INPUT_ID = "finance-invoices-work-search";

interface InvoiceListToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: string[];
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onClearStatuses: () => void;
}

export function InvoiceListToolbar({
  viewMode,
  onViewModeChange,
  search,
  filterStatus,
  columnCustomizer,
  onSearchChange,
  onToggleStatus,
  onClearStatuses,
}: InvoiceListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusLabel = (status: string) => t(`finance.invoiceStatus.${status}` as AppTranslationKey);

  return (
    <>
      <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={FINANCE_INVOICES_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("finance.searchInvoices")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <InvoicesFilterMenuButton
            filterStatus={filterStatus}
            activeFilterCount={filterStatus.length}
            onToggleStatus={onToggleStatus}
            onClearFilters={onClearStatuses}
          />

          {filterStatus.length > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearStatuses}
              label={t("finance.clearFilters")}
            />
          ) : null}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
        </div>
      </div>

      <FilterChips
        chips={filterStatus.map((status) => ({
          key: `status:${status}`,
          label: statusLabel(status),
          onRemove: () => onToggleStatus(status),
        }))}
        onClearAll={onClearStatuses}
      />
    </>
  );
}
