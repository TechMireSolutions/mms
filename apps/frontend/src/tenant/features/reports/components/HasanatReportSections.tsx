import React from "react";
import { Filter, Gift, Star, TrendingDown, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { HasanatChart } from "@/components/dashboard-widgets/charts/AttendanceChart";
import type { HasanatReportItem } from "./HasanatReport";

export interface HasanatFacultyBarItem {
  faculty: string;
  distributed: number;
  redeemed: number;
}

export interface HasanatPieItem {
  name: string;
  value: number;
}

interface HasanatReportKpisProps {
  totalDistributed: number;
  totalRedeemed: number;
  totalBalance: number;
  redemptionRate: string | number;
}

export function HasanatReportKpis({
  totalDistributed,
  totalRedeemed,
  totalBalance,
  redemptionRate,
}: HasanatReportKpisProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={Star} label={t("hasanat.report.totalDistributed")} value={formatNumber(totalDistributed)} color="primary" />
      <StatCard icon={Gift} label={t("hasanat.report.totalRedeemed")} value={formatNumber(totalRedeemed)} color="green" />
      <StatCard icon={TrendingDown} label={t("hasanat.report.balance")} value={formatNumber(totalBalance)} color="amber" />
      <StatCard icon={Users} label={t("hasanat.report.redemptionRate")} value={`${redemptionRate}%`} color="blue" />
    </div>
  );
}

interface HasanatReportChartsProps {
  facultyChartData: HasanatFacultyBarItem[];
  redemptionPieData: HasanatPieItem[];
  pieColors: string[];
  onToggleFacultyFilter: (faculty: string) => void;
}

export function HasanatReportCharts({
  facultyChartData,
  redemptionPieData,
  pieColors,
  onToggleFacultyFilter,
}: HasanatReportChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title={t("hasanat.report.distributionByFaculty")}>
        <SafeResponsiveContainer width="100%" height={180}>
          <BarChart
            data={facultyChartData}
            barSize={22}
            onClick={(state) => {
              const faculty = (
                state as { activePayload?: Array<{ payload?: { faculty?: string } }> } | undefined
              )?.activePayload?.[0]?.payload?.faculty;
              if (typeof faculty === "string" && faculty.length > 0) onToggleFacultyFilter(faculty);
            }}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="distributed" fill="hsl(var(--primary))" name={t("hasanat.report.distributed")} radius={[4, 4, 0, 0]} />
            <Bar dataKey="redeemed" fill="hsl(var(--chart-2))" name={t("hasanat.report.redeemed")} radius={[4, 4, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </SectionCard>

      <SectionCard title={t("hasanat.report.redeemedVsBalance")}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="min-w-0 flex-1">
            <SafeResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={redemptionPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                  {redemptionPieData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
          <div className="w-full shrink-0 space-y-3 sm:w-[35%]">
            {redemptionPieData.map((slice, index) => (
              <div key={slice.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: pieColors[index] }} />
                <div>
                  <p className="text-xs text-muted-foreground">{slice.name}</p>
                  <p className="text-sm font-bold text-foreground">{formatNumber(slice.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

interface HasanatFacultyFilterBannerProps {
  selectedFaculty: string | null;
  onClear: () => void;
}

export function HasanatFacultyFilterBanner({
  selectedFaculty,
  onClear,
}: HasanatFacultyFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!selectedFaculty) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{t("hasanat.report.facultyFilterLabel")}</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {selectedFaculty}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <X className="me-1 h-3 w-3" />
        {t("hasanat.report.clearFacultyFilter")}
      </Button>
    </div>
  );
}

interface HasanatDistributionTableProps {
  distribution: HasanatReportItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export function HasanatDistributionTable({
  distribution,
  selectedFaculty,
  onToggleFacultyFilter,
}: HasanatDistributionTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const headers = [
    t("hasanat.report.colStudent"),
    t("hasanat.report.colClass"),
    t("hasanat.report.colFaculty"),
    t("hasanat.report.colDistributed"),
    t("hasanat.report.colRedeemed"),
    t("hasanat.report.colBalance"),
  ];

  return (
    <>
      <ExportToolbar title={t("hasanat.report.distributionTitle")} data={distribution} headers={headers} />
      {distribution.length === 0 ? (
        <EmptyState icon={Star} title={t("hasanat.report.noData")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {distribution.map((hasanatRow) => (
              <article
                key={hasanatRow.studentName}
                className={`space-y-3 rounded-xl border border-border bg-card p-3 ${selectedFaculty === hasanatRow.faculty ? "ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-foreground">{hasanatRow.studentName}</h4>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${hasanatRow.balance > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                    {hasanatRow.balance}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colClass")}</dt>
                    <dd className="text-foreground">{hasanatRow.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colFaculty")}</dt>
                    <dd>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                        className={`h-auto min-h-11 px-0 py-0 font-normal hover:bg-transparent hover:text-foreground ${selectedFaculty === hasanatRow.faculty ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {hasanatRow.faculty}
                      </Button>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colDistributed")}</dt>
                    <dd className="font-semibold text-primary">{hasanatRow.distributed}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colRedeemed")}</dt>
                    <dd className="font-semibold text-success">{hasanatRow.redeemed}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {headerLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {distribution.map((hasanatRow) => (
                  <tr key={hasanatRow.studentName} className={`hover:bg-muted/30 ${selectedFaculty === hasanatRow.faculty ? "bg-primary/10" : ""}`}>
                    <td className="px-3 py-2.5 font-medium">{hasanatRow.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{hasanatRow.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                        className={`h-auto px-0 py-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground ${
                          selectedFaculty === hasanatRow.faculty ? "text-primary" : ""
                        }`}
                      >
                        {hasanatRow.faculty}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary">{hasanatRow.distributed}</td>
                    <td className="px-3 py-2.5 font-semibold text-success">{hasanatRow.redeemed}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hasanatRow.balance > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                        {hasanatRow.balance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

export function HasanatDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-start">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("hasanat.report.dashboardWidgetTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">
          {t("hasanat.report.dashboardWidgetSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HasanatChart />
      </div>
    </div>
  );
}
