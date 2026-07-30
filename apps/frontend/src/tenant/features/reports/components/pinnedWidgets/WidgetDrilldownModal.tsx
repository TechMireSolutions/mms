import React, { useMemo } from "react";
import { X, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { resolveWidgetTitle } from "@/lib/dashboardWidgets";
import {
  persistWidgetHasanatDistributionDelete,
  persistWidgetRecordToggle,
} from "@/lib/reports/widgetRecordToggle";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SearchBar } from "@/components/ui/SearchBar";
import { getFilteredRecords } from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
import { getWidgetRecordDisplay } from "@/tenant/features/reports/components/pinnedWidgets/widgetRecordDisplay";

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
  const { t } = useTranslation();
  const collections = useWidgetCollections();

  const widgetRecords = useMemo(() => getFilteredRecords(widget, collections), [widget, collections]);

  const {
    searchQuery: search,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems: paginatedRecords,
    filteredItems: filteredRecords,
    totalPages,
  } = useLocalPagination({
    items: widgetRecords,
    pageSize: 10,
    filterFn: (record, query) =>
      Object.values(record).some((fieldValue) =>
        String(fieldValue).toLowerCase().includes(query)
      ),
  });

  const students = useMemo(() => collections.students, [collections]);
  const studentNameMap = useMemo(() => {
    return new Map((students as unknown as Record<string, unknown>[]).map((student) => [String(student.id), String(student.name || student.studentName || student.id)]));
  }, [students]);

  const handleToggleStatus = (recordId: string) => {
    void (async () => {
      try {
        await persistWidgetRecordToggle({
          collectionName: widget.collection,
          recordId,
        });
      } catch (error) {
        console.error("Failed to toggle record status", error);
        notify.error(t("reports.widgets.errorToggleFailed"));
      }
    })();
  };

  const handleDeleteDist = (distId: string) => {
    void (async () => {
      try {
        await persistWidgetHasanatDistributionDelete(distId);
      } catch (error) {
        console.error("Failed to delete distribution", error);
        notify.error(t("reports.widgets.errorDeleteFailed"));
      }
    })();
  };

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
        {/* Modal Header */}
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

        {/* Modal Search Bar */}
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

        {/* Modal Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <EyeOff className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold uppercase tracking-wider">{t("reports.widgets.noRecords")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {paginatedRecords.map((recordSource, index) => {
                  const { recordId, name, detailText, status, hasAction } = getWidgetRecordDisplay(
                    recordSource, index, widget, studentNameMap, t,
                  );
                  return (
                    <article
                      key={recordId}
                      className="space-y-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-bold text-foreground">{name}</p>
                        <StatusBadge
                          status={status.toLowerCase()}
                          size="sm"
                          config={{
                            active: { label: t("reports.status.active"), cls: SEMANTIC_BADGE.success },
                            paid: { label: t("reports.status.paid"), cls: SEMANTIC_BADGE.success },
                            present: { label: t("reports.status.present"), cls: SEMANTIC_BADGE.success },
                            customer: { label: t("reports.status.customer"), cls: SEMANTIC_BADGE.success },
                            inactive: { label: t("reports.status.inactive"), cls: SEMANTIC_BADGE.destructive },
                            unpaid: { label: t("reports.status.unpaid"), cls: SEMANTIC_BADGE.destructive },
                            absent: { label: t("reports.status.absent"), cls: SEMANTIC_BADGE.destructive },
                            lead: { label: t("reports.status.lead"), cls: SEMANTIC_BADGE.destructive },
                            cancelled: { label: t("reports.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
                          }}
                        />
                      </div>
                      <dl className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t("reports.widgets.primaryInfo")}</dt>
                          <dd className="text-muted-foreground font-semibold">{detailText}</dd>
                        </div>
                      </dl>
                      {(widget.collection === "hasanat_distributions" || hasAction) && (
                        <div className="pt-1">
                          {widget.collection === "hasanat_distributions" ? (
                            <Button
                              onClick={() => handleDeleteDist(recordId)}
                              variant="destructive"
                              size="sm"
                              className="w-full px-2.5 rounded font-bold uppercase tracking-wider text-xs shadow-none"
                            >
                              {t("reports.widgets.delete")}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleToggleStatus(recordId)}
                              variant="secondary"
                              size="sm"
                              className="w-full px-2.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-transparent hover:border-transparent font-bold uppercase tracking-wider text-xs shadow-none"
                            >
                              {t("reports.widgets.toggleStatus")}
                            </Button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border text-muted-foreground uppercase font-black text-xs tracking-wider text-start hover:bg-transparent">
                      <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.refName")}</TableHead>
                      <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.primaryInfo")}</TableHead>
                      <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.currentStatus")}</TableHead>
                      <TableHead className="pb-3 text-end text-muted-foreground h-auto">{t("reports.widgets.microAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {paginatedRecords.map((recordSource, index) => {
                      const { recordId, name, detailText, status, hasAction } = getWidgetRecordDisplay(
                        recordSource, index, widget, studentNameMap, t,
                      );

                      return (
                        <TableRow key={recordId} className="hover:bg-muted/10">
                          <TableCell className="py-3.5 pe-2 font-bold text-foreground max-w-[11.25rem] truncate">{name}</TableCell>
                          <TableCell className="py-3.5 text-muted-foreground font-semibold">{detailText}</TableCell>
                          <TableCell className="py-3.5">
                            <StatusBadge
                              status={status.toLowerCase()}
                              size="sm"
                              config={{
                                active: { label: t("reports.status.active"), cls: SEMANTIC_BADGE.success },
                                paid: { label: t("reports.status.paid"), cls: SEMANTIC_BADGE.success },
                                present: { label: t("reports.status.present"), cls: SEMANTIC_BADGE.success },
                                customer: { label: t("reports.status.customer"), cls: SEMANTIC_BADGE.success },
                                inactive: { label: t("reports.status.inactive"), cls: SEMANTIC_BADGE.destructive },
                                unpaid: { label: t("reports.status.unpaid"), cls: SEMANTIC_BADGE.destructive },
                                absent: { label: t("reports.status.absent"), cls: SEMANTIC_BADGE.destructive },
                                lead: { label: t("reports.status.lead"), cls: SEMANTIC_BADGE.destructive },
                                cancelled: { label: t("reports.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-3.5 text-end">
                            {widget.collection === "hasanat_distributions" ? (
                              <Button
                                onClick={() => handleDeleteDist(recordId)}
                                variant="destructive"
                                size="sm"
                                className="px-2.5 rounded text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer font-bold uppercase tracking-wider text-xs shadow-none"
                              >
                                {t("reports.widgets.delete")}
                              </Button>
                            ) : hasAction ? (
                              <Button
                                onClick={() => handleToggleStatus(recordId)}
                                variant="secondary"
                                size="sm"
                                className="px-2.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-transparent hover:border-transparent transition-all cursor-pointer font-bold uppercase tracking-wider text-xs shadow-none"
                              >
                                {t("reports.widgets.toggleStatus")}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Modal Pagination Footer */}
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
