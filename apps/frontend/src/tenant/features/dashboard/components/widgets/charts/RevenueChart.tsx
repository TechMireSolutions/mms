import React, { useState, useMemo, useCallback } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { useBrandedDashboardChartColors } from "@/tenant/features/dashboard/hooks/useBrandedDashboardChartColors";
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, TooltipContentProps, TooltipPayloadEntry,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useFinanceInvoicesCollection } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useAccountingEntriesCollection, useAccountingAccountsCollection } from "@/tenant/features/accounting/hooks/useAccountingApi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORM_SELECT_MINI } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useDashboardConfig } from "@/tenant/features/dashboard/hooks/useDashboardConfig";
import { getRecentMonthsList } from "@/lib/utils";
import { getCollectedAmountForInvoice } from "@mms/shared";

interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

/**
 * CustomTooltip for Revenue Chart.
 * @param {TooltipContentProps<number, string>} props
 */
const CustomTooltip = ({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) => {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-4 py-3 shadow-lg text-xs space-y-1.5 text-left select-none">
      <p className="text-muted-foreground/80 text-[10px] font-bold m-0">{label}</p>
      {payload.map((payloadEntry: TooltipPayloadEntry) => (
        <div key={payloadEntry.dataKey as string | number} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: payloadEntry.color }} aria-hidden="true" />
          <span className="text-muted-foreground/85 text-xs capitalize">
            {payloadEntry.dataKey === "revenue"
              ? t("accounting.dashboard.revenue")
              : t("accounting.dashboard.expenses")}
          </span>
          <span className="font-bold text-foreground ms-auto tabular-nums">

            {formatCurrency(Number(payloadEntry.value))}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Revenue Chart component.
 * Displays financial revenue and expenses over a selected period.
 * @returns {React.ReactElement}
 */
export default function RevenueChart({ isEditMode = false }: { isEditMode?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useFinanceCurrency();
  const { revenue: COLOR_THEMES } = useBrandedDashboardChartColors();
  const [period, setPeriod] = useState<"6m" | "10m">("10m");
  const invoices = useFinanceInvoicesCollection();
  const entries = useAccountingEntriesCollection();
  const accounts = useAccountingAccountsCollection();

  const {
    revenueChartType: chartType,
    revenueChartColor: colorTheme,
    updatePref,
  } = useDashboardConfig();

  const months = useMemo((): { key: string; label: string }[] => getRecentMonthsList(10), []);

  const revenueData: RevenuePoint[] = useMemo(() => {
    const postedEntries = entries.filter((journalEntry) => journalEntry.status === "posted");
    const hasAccountingData = postedEntries.length > 0 && accounts.length > 0;

    return months.map((monthDefinition) => {
      let revenue = 0;
      let expenses = 0;

      if (hasAccountingData) {
        postedEntries.forEach((journalEntry) => {
          const entryMonth = journalEntry.date.slice(0, 7);
          if (entryMonth === monthDefinition.key) {
            journalEntry.lines.forEach((journalLine) => {
              const account = accounts.find((accountOption) => accountOption.id === journalLine.account_id);
              if (account?.type === "Revenue") {
                revenue += (journalLine.credit - journalLine.debit);
              }
              if (account?.type === "Expense") {
                expenses += (journalLine.debit - journalLine.credit);
              }
            });
          }
        });
      } else {
        invoices.forEach((invoice) => {
          if (!invoice || invoice.status === "cancelled") return;
          const invoiceMonth = (invoice.paidDate || invoice.dueDate || "").slice(0, 7);
          if (invoiceMonth === monthDefinition.key) {
            revenue += getCollectedAmountForInvoice(invoice);
          }
        });
        expenses = invoices.length > 0 ? Math.round(revenue * 0.6) : 0;
      }

      return {
        month: monthDefinition.label,
        revenue,
        expenses
      };
    });
  }, [months, invoices, entries, accounts]);
  
  const visibleRevenueData = period === "6m" ? revenueData.slice(-6) : revenueData;
  const activeColors = COLOR_THEMES[colorTheme] || COLOR_THEMES.mixed;

  const formatYAxisTick = useCallback((value: number) => {
    if (value === 0) return formatCurrency(0);
    return `${formatCurrency(Math.round(value / 1000))}k`;
  }, [formatCurrency]);

  return (
    <WidgetCard ariaLabelledby="revenue-chart-heading" accentColor="primary" className="p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-5 pl-1.5 select-none">
        <div>
          <h3 id="revenue-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t("widget.title.revenueExpenses")}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1 m-0 font-medium">
            {t("dashboard.charts.revenue.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 ms-auto">

          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(chartTypeValue) => {
                  updatePref("revenueChartType", chartTypeValue as "bar" | "line" | "area");
                }}
              >
                <SelectTrigger className={FORM_SELECT_MINI}>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">{t("dashboard.charts.attendance.barChart")}</SelectItem>
                  <SelectItem value="line">{t("dashboard.charts.attendance.lineChart")}</SelectItem>
                  <SelectItem value="area">{t("dashboard.charts.attendance.areaChart")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={colorTheme}
                onValueChange={(selectedColorTheme) => {
                  updatePref("revenueChartColor", selectedColorTheme);
                }}
              >
                <SelectTrigger className={FORM_SELECT_MINI}>
                  <SelectValue placeholder="Select color theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{t("dashboard.charts.hasanat.mixed")}</SelectItem>
                  <SelectItem value="emerald">{t("dashboard.charts.attendance.emerald")}</SelectItem>
                  <SelectItem value="violet">{t("dashboard.charts.attendance.violet")}</SelectItem>
                  <SelectItem value="blue">{t("dashboard.charts.attendance.blue")}</SelectItem>
                  <SelectItem value="amber">{t("dashboard.charts.attendance.amber")}</SelectItem>
                  <SelectItem value="red">{t("dashboard.charts.attendance.red")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-1 bg-muted/65 rounded-lg p-0.5 border border-border/50">
            {(["6m", "10m"] as const).map((periodOption) => (
              <Button
                key={periodOption}
                variant="ghost"
                onClick={() => setPeriod(periodOption)}
                aria-pressed={period === periodOption}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 h-auto rounded-md transition-all shadow-none cursor-pointer ${
                  period === periodOption ? "bg-card text-foreground hover:bg-card hover:text-foreground" : "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                }`}
              >
                {periodOption}
              </Button>
            ))}
          </div>
        </div>
      </header>
 
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4" aria-hidden="true">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.revenue }} />
          <span className="text-[11px] text-muted-foreground">
            {t("accounting.dashboard.revenue")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeColors.expenses }} />
          <span className="text-[11px] text-muted-foreground">
            {t("accounting.dashboard.expenses")}
          </span>
        </div>
      </div>
 
      <SafeResponsiveContainer height={200}>
        <ComposedChart
          data={visibleRevenueData}
          margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
          onClick={() => {
            if (!isEditMode) {
              navigate(ROUTES.accounting);
            }
          }}
          className={isEditMode ? "cursor-default" : "cursor-pointer"}
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={activeColors.revenue} stopOpacity={0.2} />
              <stop offset="95%" stopColor={activeColors.revenue} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={activeColors.expenses} stopOpacity={0.15} />
              <stop offset="95%" stopColor={activeColors.expenses} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxisTick} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
          
          {chartType === "area" && (
            <>
              <Area type="monotone" dataKey="revenue" stroke={activeColors.revenue} strokeWidth={2.5} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" stroke={activeColors.expenses} strokeWidth={2.5} fill="url(#expGrad)" />
            </>
          )}
          {chartType === "line" && (
            <>
              <Line type="monotone" dataKey="revenue" stroke={activeColors.revenue} strokeWidth={2.5} dot={{ r: 3, fill: activeColors.revenue }} />
              <Line type="monotone" dataKey="expenses" stroke={activeColors.expenses} strokeWidth={2.5} dot={{ r: 3, fill: activeColors.expenses }} />
            </>
          )}
          {chartType === "bar" && (
            <>
              <Bar dataKey="revenue" fill={activeColors.revenue} fillOpacity={activeColors.fillOpacityRevenue} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expenses" fill={activeColors.expenses} fillOpacity={activeColors.fillOpacityExpenses} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </>
          )}
        </ComposedChart>
      </SafeResponsiveContainer>
    </WidgetCard>
  );
}
