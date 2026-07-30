import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Table } from "lucide-react";
import { formatNumber } from "@mms/shared";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type {
  AggregatedItem,
  ChartOperation,
} from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";

interface VisualizerKpiCardsProps {
  processedData: AggregatedItem[];
  t: TranslationFunction;
}

export function VisualizerKpiCards({
  processedData,
  t,
}: VisualizerKpiCardsProps): React.JSX.Element | null {
  if (processedData.length === 0) return null;
  const totalValue = processedData.reduce((sum, aggregatedItem) => sum + aggregatedItem.value, 0);
  const avgGroupValue = Math.round(totalValue / processedData.length);
  const topGroup = processedData[0]?.name || "N/A";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.totalAggregated")}</span>
        <span className="text-sm font-black text-foreground mt-1 leading-none">{formatNumber(totalValue)}</span>
      </div>
      <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.avgPerGroup")}</span>
        <span className="text-sm font-black text-foreground mt-1 leading-none">{formatNumber(avgGroupValue)}</span>
      </div>
      <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.topGroup")}</span>
        <span className="text-sm font-black text-foreground mt-1 leading-none truncate block max-w-full">{topGroup}</span>
      </div>
    </div>
  );
}

interface VisualizerDataMatrixProps {
  showDataTable: boolean;
  processedData: AggregatedItem[];
  operation: ChartOperation;
  onToggleDataTable: () => void;
  t: TranslationFunction;
}

export function VisualizerDataMatrix({
  showDataTable,
  processedData,
  operation,
  onToggleDataTable,
  t,
}: VisualizerDataMatrixProps): React.JSX.Element {
  return (
    <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggleDataTable}
        className="min-h-11 w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground select-none shadow-none px-0"
      >
        <span className="flex items-center gap-1.5">
          <Table className="w-4 h-4 text-primary" />
          {t("reports.visualizer.dataMatrix")}
        </span>
        {showDataTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {showDataTable && processedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-border/60 bg-card/25 rounded-2xl overflow-hidden mt-1 max-h-[13.75rem] overflow-y-auto">
              <div className="space-y-3 p-3 md:hidden">
                {processedData.map((processedRow, index) => (
                  <article key={index} className="space-y-2 rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-semibold text-foreground">{processedRow.name}</p>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">
                          {t("reports.visualizer.aggregatedValue", { op: operation.toUpperCase() })}
                        </dt>
                        <dd className="font-bold text-primary">{formatNumber(processedRow.value)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("reports.visualizer.recordCount")}</dt>
                        <dd className="text-muted-foreground">{processedRow.count}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted/50 border-b border-border/50 text-xs font-black uppercase text-muted-foreground tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">{t("reports.visualizer.xAxisCategory")}</th>
                      <th className="px-4 py-2.5">{t("reports.visualizer.aggregatedValue", { op: operation.toUpperCase() })}</th>
                      <th className="px-4 py-2.5">{t("reports.visualizer.recordCount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {processedData.map((processedRow, index) => (
                      <tr key={index} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-foreground font-semibold">{processedRow.name}</td>
                        <td className="px-4 py-2.5 text-primary font-bold">{formatNumber(processedRow.value)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{processedRow.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
