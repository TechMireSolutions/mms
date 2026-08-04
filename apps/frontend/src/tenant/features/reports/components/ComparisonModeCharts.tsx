import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { formatNumber } from "@mms/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ComparisonDataItem, DateRangeDataItem } from "./comparisonModeTypes";
import { WORK_SURFACE } from "@/components/ui/formStyles";

type ComparisonModeChartData = Array<ComparisonDataItem | DateRangeDataItem>;

interface ComparisonModeChartsProps {
  mode: "sessions" | "daterange";
  translatedData: ComparisonModeChartData;
  labelA: string | undefined;
  labelB: string | undefined;
  isContacts: boolean;
}

export function ComparisonModeCharts({
  mode,
  translatedData,
  labelA,
  labelB,
  isContacts,
}: ComparisonModeChartsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { primary, secondary } = useBrandPalette();
  const { formatCurrency } = useFinanceCurrency();

  const formatVal = (val: number, key?: string) => {
    if (key === "feeCollected") return formatCurrency(val);
    if (key === "attendancePct" || key === "passRatePct") return `${val}%`;
    return formatNumber(val);
  };

  const formatDiff = (diff: number, key?: string) => {
    const sign = diff > 0 ? "+" : "";
    if (key === "feeCollected") return `${sign}${formatCurrency(diff)}`;
    if (key === "attendancePct" || key === "passRatePct") return `${sign}${diff}%`;
    return `${sign}${formatNumber(diff)}`;
  };

  const sessionRows = translatedData as ComparisonDataItem[];

  return (
    <>
      <div className={`${WORK_SURFACE} p-5 text-start`}>
        <p className="text-xs text-muted-foreground mb-3">
          {t("reports.comparison.comparing")} <span className="font-semibold text-primary">{labelA}</span> {t("reports.comparison.vs")} <span className="font-semibold text-warning">{labelB}</span>
        </p>
        <div className="h-[13.75rem] w-full">
          <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={translatedData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={mode === "sessions" ? "metric" : "month"} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="a" name={labelA} fill={primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="b" name={labelB} fill={secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeResponsiveContainer>
        </div>
      </div>

      {mode === "sessions" && (
        <div className={`${WORK_SURFACE} overflow-hidden`}>
          <div className="space-y-3 p-3 md:hidden">
            {sessionRows.map((row) => {
              const diff = parseFloat((row.a - row.b).toFixed(1));
              return (
                <article key={row.metric} className="space-y-2 rounded-xl border border-border bg-card p-3">
                  <h4 className="text-sm font-bold text-foreground m-0">{row.metric}</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-primary">{isContacts ? t("reports.comparison.targetA") : t("reports.comparison.sessionA")}</dt>
                      <dd className="font-bold text-primary">{formatVal(row.a, row.metricKey)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-warning">{isContacts ? t("reports.comparison.targetB") : t("reports.comparison.sessionB")}</dt>
                      <dd className="font-bold text-warning">{formatVal(row.b, row.metricKey)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-semibold text-muted-foreground">{t("reports.comparison.diff")}</dt>
                      <dd className={`text-xs font-black ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatDiff(diff, row.metricKey)}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-3 py-2 text-start text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.comparison.metric")}</th>
                  <th className="px-3 py-2 text-start text-xs font-bold text-primary uppercase tracking-widest">{isContacts ? t("reports.comparison.targetA") : t("reports.comparison.sessionA")}</th>
                  <th className="px-3 py-2 text-start text-xs font-bold text-warning uppercase tracking-widest">{isContacts ? t("reports.comparison.targetB") : t("reports.comparison.sessionB")}</th>
                  <th className="px-3 py-2 text-start text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.comparison.diff")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-start bg-transparent">
                {sessionRows.map((row) => {
                  const diff = parseFloat((row.a - row.b).toFixed(1));

                  return (
                    <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-bold text-foreground">{row.metric}</td>
                      <td className="px-3 py-3 text-primary font-bold">{formatVal(row.a, row.metricKey)}</td>
                      <td className="px-3 py-3 text-warning font-bold">{formatVal(row.b, row.metricKey)}</td>
                      <td className={`px-3 py-3 text-xs font-black ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatDiff(diff, row.metricKey)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
