import React from "react";
import { X, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { resolveWidgetTitle } from "@/lib/dashboardWidgets";
import { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { Button } from "@/components/ui/button";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { useWidgetDrilldownModal } from "@/tenant/features/reports/components/pinnedWidgets/useWidgetDrilldownModal";
import { WidgetDrilldownModalRecords } from "@/tenant/features/reports/components/pinnedWidgets/WidgetDrilldownModalRecords";

/**
 * Focused overlay drilldown modal for micro-interactions.
 * Displays details of records matching the single metric.
 */
export function WidgetDrilldownModal({
  widget,
  onClose
}: {
  widget: CustomWidget;
  onClose: () => void;
}): React.JSX.Element {
  const {
    t,
    searchQuery: search,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems,
    filteredItems: filteredRecords,
    totalPages,
    studentNameMap,
    handleToggleStatus,
    handleDeleteDist,
  } = useWidgetDrilldownModal(widget);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        className="w-full max-w-2xl bg-card dark:bg-card/90 border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-start"
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/45 bg-muted/20 p-6">
          <div className="min-w-0 space-y-1">
            <span className="block text-xs font-black uppercase tracking-widest text-primary">{t("reports.widgets.drilldownTitle")}</span>
            <h3 className="truncate text-base font-black text-foreground">{t("reports.widgets.records", { title: resolveWidgetTitle(widget, t) })}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 rounded-full border border-border text-muted-foreground shadow-none transition-all hover:bg-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-border/45 bg-muted/10 flex flex-wrap items-center justify-between gap-2">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder={t("reports.widgets.searchRecords")}
            className="min-w-0 flex-1 max-w-sm"
          />
          <span className="text-xs text-muted-foreground font-bold px-2 py-1.5 bg-muted rounded-full border border-border shrink-0">
            {t("reports.widgets.foundCount", { count: filteredRecords.length })}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <EyeOff className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold uppercase tracking-wider">{t("reports.widgets.noRecords")}</p>
            </div>
          ) : (
            <WidgetDrilldownModalRecords
              t={t}
              widget={widget}
              paginatedItems={paginatedItems}
              studentNameMap={studentNameMap}
              handleToggleStatus={handleToggleStatus}
              handleDeleteDist={handleDeleteDist}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/45 bg-muted/20 flex items-center justify-end select-none text-xs gap-4">
            <span className="text-xs font-bold text-muted-foreground">
              {t("reports.widgets.foundCount", { count: filteredRecords.length })}
            </span>
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
