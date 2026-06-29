import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { Star, Gift, TrendingDown, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/hooks/useHasanatApi";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import { EmptyState } from "../ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";

/** Active filter state passed down from the parent report view. */
import { HasanatChart } from "@/components/widgets/charts/AttendanceChart";

interface HasanatReportFilters {
  /** Class name to filter by, or "all" for no filter. */
  class: string;
  /** Substring to match against student names (case-insensitive). */
  student: string;
}

/** Props for the HasanatReport component. */
interface HasanatReportProps {
  /** Active report filters. */
  filters: HasanatReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

export interface HasanatReportItem {
  studentName: string;
  class: string;
  faculty: string;
  distributed: number;
  redeemed: number;
  balance: number;
}

export interface HasanatByFacultyItem {
  faculty: string;
  totalDistributed: number;
  totalRedeemed: number;
}

/** Shaped bar-chart entry derived from faculty Hasanat data. */
interface FacultyBarDatum {
  faculty: string;
  distributed: number;
  redeemed: number;
}

/** Pie chart entry for the redeemed/balance donut chart. */
interface PieDatum {
  name: string;
  value: number;
}

/**
 * Renders Hasanat reward-point reports including summary KPIs, a faculty
 * distribution bar chart, a redeemed-vs-balance donut, and a filterable table.
 *
 * @param props - The component props.
 * @returns The HasanatReport component.
 */
export default function HasanatReport({ filters }: HasanatReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const palette = useBrandPalette();
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2]],
    [palette],
  );
  const distributions = useHasanatDistributionsCollection();
  const denoms = useHasanatDenomsCollection();

  const { distributionData, hasanatByFaculty } = useMemo(() => {
    const studentMap: Record<string, HasanatReportItem> = {};
    const facultyMap: Record<string, HasanatByFacultyItem> = {};

    const pointsMap = new Map<string, number>();
    denoms.forEach((denom) => {
      pointsMap.set(denom.id, denom.points);
    });

    distributions.forEach((distributionRecord) => {
      // Resolve points from the database denoms collection
      const points = pointsMap.get(distributionRecord.denominationId) || 50;

      const totalPoints = points * distributionRecord.quantity;
      const isRedeemed = distributionRecord.status === "redeemed";

      if (distributionRecord.recipientType === "student") {
        const studentKey = distributionRecord.recipientStudentId || distributionRecord.recipientName || "";
        if (studentKey) {
          const label = distributionRecord.recipientName || studentKey;
          if (!studentMap[studentKey]) {
            studentMap[studentKey] = {
              studentName: label,
              class: distributionRecord.recipientClass,
              faculty: distributionRecord.issuedBy || "—",
              distributed: 0,
              redeemed: 0,
              balance: 0
            };
          }
          studentMap[studentKey].distributed += totalPoints;
          if (isRedeemed) studentMap[studentKey].redeemed += totalPoints;
          else studentMap[studentKey].balance += totalPoints;
        }
      }

      const facultyKey = distributionRecord.issuedBy || "—";
      if (!facultyMap[facultyKey]) {
        facultyMap[facultyKey] = {
          faculty: facultyKey,
          totalDistributed: 0,
          totalRedeemed: 0
        };
      }
      facultyMap[facultyKey].totalDistributed += totalPoints;
      if (isRedeemed) facultyMap[facultyKey].totalRedeemed += totalPoints;
    });

    return {
      distributionData: Object.values(studentMap),
      hasanatByFaculty: Object.values(facultyMap)
    };
  }, [distributions, denoms]);

  const distribution = useMemo<HasanatReportItem[]>(() => {
    let list = distributionData;
    if (filters.class !== "all") {
      list = list.filter((hasanatItem) => hasanatItem.class === filters.class);
    }
    if (filters.student) {
      list = list.filter((hasanatItem) =>
        hasanatItem.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return list;
  }, [filters, distributionData]);

  const totalDistributed = distribution.reduce((total, hasanatItem) => total + hasanatItem.distributed, 0);
  const totalRedeemed    = distribution.reduce((total, hasanatItem) => total + hasanatItem.redeemed, 0);
  const totalBalance     = distribution.reduce((total, hasanatItem) => total + hasanatItem.balance, 0);
  const redemptionRate   = totalDistributed
    ? ((totalRedeemed / totalDistributed) * 100).toFixed(1)
    : 0;

  const facultyData = useMemo<FacultyBarDatum[]>(() => {
    return hasanatByFaculty.map((facultyTotals) => ({
      faculty:     facultyTotals.faculty.split(" ").slice(-1)[0] ?? facultyTotals.faculty,
      distributed: facultyTotals.totalDistributed,
      redeemed:    facultyTotals.totalRedeemed,
    }));
  }, [hasanatByFaculty]);

  const pieData: PieDatum[] = [
    { name: t("hasanat.report.redeemedPieLabel"), value: totalRedeemed },
    { name: t("hasanat.report.balancePieLabel"),  value: totalBalance  },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={Star}         label={t("hasanat.report.totalDistributed")} value={totalDistributed.toLocaleString()} color="primary" />
        <ReportSummaryCard icon={Gift}         label={t("hasanat.report.totalRedeemed")}    value={totalRedeemed.toLocaleString()}    color="green"   />
        <ReportSummaryCard icon={TrendingDown} label={t("hasanat.report.balance")}           value={totalBalance.toLocaleString()}     color="amber"   />
        <ReportSummaryCard icon={Users}        label={t("hasanat.report.redemptionRate")}   value={`${redemptionRate}%`}             color="blue"    />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("hasanat.report.distributionByFaculty")}</p>
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart data={facultyData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="distributed" fill="hsl(var(--primary))"  name={t("hasanat.report.distributed")} radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed"    fill="hsl(var(--chart-2))"  name={t("hasanat.report.redeemed")}    radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("hasanat.report.redeemedVsBalance")}</p>
          <div className="flex items-center gap-4">
            <SafeResponsiveContainer width="60%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v !== undefined ? Number(v).toLocaleString() : ""} />
              </PieChart>
            </SafeResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <div>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                    <p className="text-sm font-bold text-foreground">{d.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution table */}
      <ReportExportBar 
        title={t("hasanat.report.distributionTitle")} 
        data={distribution}
        headers={[
          t("hasanat.report.colStudent"),
          t("hasanat.report.colClass"),
          t("hasanat.report.colFaculty"),
          t("hasanat.report.colDistributed"),
          t("hasanat.report.colRedeemed"),
          t("hasanat.report.colBalance"),
        ]}
      />
      {distribution.length === 0 ? (
        <EmptyState icon={Star} title={t("hasanat.report.noData")} compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("hasanat.report.colStudent"),
                  t("hasanat.report.colClass"),
                  t("hasanat.report.colFaculty"),
                  t("hasanat.report.colDistributed"),
                  t("hasanat.report.colRedeemed"),
                  t("hasanat.report.colBalance"),
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {distribution.map((h) => (
                <tr key={h.studentName} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium">{h.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{h.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{h.faculty}</td>
                  <td className="px-3 py-2.5 font-semibold text-primary">{h.distributed}</td>
                  <td className="px-3 py-2.5 font-semibold text-success">{h.redeemed}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${h.balance > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                      {h.balance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-left">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("hasanat.report.dashboardWidgetTitle")}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("hasanat.report.dashboardWidgetSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HasanatChart />
        </div>
      </div>
    </div>
  );
}
