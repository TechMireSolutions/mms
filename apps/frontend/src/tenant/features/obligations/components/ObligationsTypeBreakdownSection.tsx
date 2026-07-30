import { Card } from "@/components/ui/card";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import { BarChart2 } from "lucide-react";

import { SectionTitle } from "./ObligationsSectionTitle";
import type { TypeBreakdownEntry } from "./ObligationsSummaryChartsSection";

interface ObligationsTypeBreakdownSectionProps {
  typeBreakdown: TypeBreakdownEntry[];
  colors: string[];
  totalAmount: number;
  activeCurrencyCode: string;
  formatCurrency: (amount: number | string | null | undefined) => string;
  formatValueOnly: (amount: number | string | null | undefined) => string;
}

export function ObligationsTypeBreakdownSection({
  typeBreakdown,
  colors,
  totalAmount,
  activeCurrencyCode,
  formatCurrency,
  formatValueOnly,
}: ObligationsTypeBreakdownSectionProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("obligations.summary.types.aria")}>
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle icon={BarChart2} title={t("obligations.summary.types.title")} subtitle={t("obligations.summary.types.subtitle")} noMargin />
        <ExportToolbar
          title={t("obligations.summary.types.title")}
          filename="obligation_type_breakdown"
          moduleId="obligations"
          exportLabel={t("obligations.summary.types.exportLabel")}
          columns={[
            { header: t("obligations.summary.types.colType"), key: "name" },
            { header: t("obligations.summary.types.colCollections"), key: "count" },
            { header: t("obligations.summary.types.colTotalAmount", { currency: activeCurrencyCode }), key: "totalFmt" },
            { header: t("obligations.summary.types.colShare"), key: "shareFmt" },
          ]}
          rows={typeBreakdown.map((typeBreakdownItem) => ({
            ...typeBreakdownItem,
            totalFmt: formatCurrency(typeBreakdownItem.total),
            shareFmt: totalAmount ? ((typeBreakdownItem.total / totalAmount) * 100).toFixed(1) + "%" : "0%",
          }))}
        />
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {typeBreakdown.map((typeBreakdownItem, index) => {
          const sharePercent = totalAmount ? (typeBreakdownItem.total / totalAmount) * 100 : 0;

          return (
            <Card key={typeBreakdownItem.name} accentColor="primary" className="p-4 space-y-1.5 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md transition-all">
              <header className="flex min-w-0 items-center justify-between gap-2">
                <h3 className="min-w-0 truncate text-xs font-bold text-foreground m-0">{typeBreakdownItem.name}</h3>
                <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: colors[index % colors.length] }}>
                  {typeBreakdownItem.count}
                </span>
              </header>
              <p className="text-lg font-bold text-foreground font-mono m-0">{formatValueOnly(typeBreakdownItem.total)}</p>
              <p className="text-xs text-muted-foreground m-0">{t("obligations.summary.types.countWithCurrency", { currency: activeCurrencyCode, count: typeBreakdownItem.count })}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1" role="progressbar" aria-valuenow={sharePercent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${sharePercent}%`, background: colors[index % colors.length] }} />
              </div>
              <p className="text-xs text-muted-foreground text-end m-0">{totalAmount ? sharePercent.toFixed(1) : 0}%</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
