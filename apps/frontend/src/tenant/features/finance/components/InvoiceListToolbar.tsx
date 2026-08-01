import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, X } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { INVOICE_STATUSES } from "@/lib/data/financeData";

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
  search,
  filterStatus,
  columnCustomizer,
  onSearchChange,
  onToggleStatus,
  onClearStatuses,
  viewMode,
  onViewModeChange,
}: InvoiceListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusLabel = (status: string) => t(`finance.invoiceStatus.${status}` as AppTranslationKey);

  return (
    <>
      <header className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={t("finance.searchInvoices")}
            className="w-full"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("finance.filter.status")}
              {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{filterStatus.length}</span>}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("finance.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INVOICE_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filterStatus.includes(status)}
                onCheckedChange={() => onToggleStatus(status)}
              >
                {statusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </header>

      <AnimatePresence>
        {filterStatus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 flex-wrap"
            aria-label={t("finance.filter.active")}
          >
            {filterStatus.map((status) => (
              <Button
                key={status}
                onClick={() => onToggleStatus(status)}
                aria-label={t("finance.filter.remove", { label: statusLabel(status) })}
                className="flex min-h-11 items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {statusLabel(status)} <X className="w-3 h-3" aria-hidden="true" />
              </Button>
            ))}
            <Button
              variant="link"
              onClick={onClearStatuses}
              className="text-xs text-muted-foreground hover:text-foreground underline min-h-11 px-2"
            >
              {t("common.clearFilters")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
