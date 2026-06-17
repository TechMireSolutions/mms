import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { Star, Gift, TrendingDown, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { DISTRIBUTIONS, Distribution } from '@/lib/data/hasanatData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

/** Active filter state passed down from the parent report view. */
import { HasanatChart } from "../dashboard/charts/AttendanceChart";

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
  const palette = useBrandPalette();
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2]],
    [palette],
  );
  const distributions = useLiveCollection<Distribution>("hasanat_distributions", DISTRIBUTIONS);

  const { distributionData, hasanatByFaculty } = useMemo(() => {
    const studentMap: Record<string, HasanatReportItem> = {};
    const facultyMap: Record<string, HasanatByFacultyItem> = {};

    distributions.forEach(d => {
      // Calculate points (mock logic based on name string for demo if points aren't in dist object)
      let points = 50; // default bronze
      if (d.denominationName?.toLowerCase().includes("silver")) points = 150;
      else if (d.denominationName?.toLowerCase().includes("gold")) points = 500;
      else if (d.denominationName?.toLowerCase().includes("platinum")) points = 1000;
      else if (d.denominationName?.toLowerCase().includes("diamond")) points = 2500;

      const totalPoints = points * d.quantity;
      const isRedeemed = d.status === "redeemed";

      if (d.recipientType === "student") {
        if (!studentMap[d.recipientName]) {
          studentMap[d.recipientName] = {
            studentName: d.recipientName,
            class: d.recipientClass,
            faculty: d.issuedBy,
            distributed: 0,
            redeemed: 0,
            balance: 0
          };
        }
        studentMap[d.recipientName].distributed += totalPoints;
        if (isRedeemed) studentMap[d.recipientName].redeemed += totalPoints;
        else studentMap[d.recipientName].balance += totalPoints;
      }

      if (!facultyMap[d.issuedBy]) {
        facultyMap[d.issuedBy] = {
          faculty: d.issuedBy,
          totalDistributed: 0,
          totalRedeemed: 0
        };
      }
      facultyMap[d.issuedBy].totalDistributed += totalPoints;
      if (isRedeemed) facultyMap[d.issuedBy].totalRedeemed += totalPoints;
    });

    return {
      distributionData: Object.values(studentMap),
      hasanatByFaculty: Object.values(facultyMap)
    };
  }, [distributions]);

  const distribution = useMemo<HasanatReportItem[]>(() => {
    let list = distributionData;
    if (filters.class !== "all") {
      list = list.filter((h) => h.class === filters.class);
    }
    if (filters.student) {
      list = list.filter((h) =>
        h.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return list;
  }, [filters, distributionData]);

  const totalDistributed = distribution.reduce((a, h) => a + h.distributed, 0);
  const totalRedeemed    = distribution.reduce((a, h) => a + h.redeemed, 0);
  const totalBalance     = distribution.reduce((a, h) => a + h.balance, 0);
  const redemptionRate   = totalDistributed
    ? ((totalRedeemed / totalDistributed) * 100).toFixed(1)
    : 0;

  const facultyData = useMemo<FacultyBarDatum[]>(() => {
    return hasanatByFaculty.map((f) => ({
      faculty:     f.faculty.split(" ").slice(-1)[0] ?? f.faculty,
      distributed: f.totalDistributed,
      redeemed:    f.totalRedeemed,
    }));
  }, [hasanatByFaculty]);

  const pieData: PieDatum[] = [
    { name: "Redeemed", value: totalRedeemed },
    { name: "Balance",  value: totalBalance  },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={Star}         label="Total Distributed" value={totalDistributed.toLocaleString()} color="primary" />
        <ReportSummaryCard icon={Gift}         label="Total Redeemed"    value={totalRedeemed.toLocaleString()}    color="green"   />
        <ReportSummaryCard icon={TrendingDown} label="Balance"           value={totalBalance.toLocaleString()}     color="amber"   />
        <ReportSummaryCard icon={Users}        label="Redemption Rate"   value={`${redemptionRate}%`}             color="blue"    />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Distribution by Faculty</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={facultyData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="distributed" fill="hsl(var(--primary))"  name="Distributed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed"    fill="hsl(var(--chart-2))"  name="Redeemed"    radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Redeemed vs Balance</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={160}>
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
            </ResponsiveContainer>
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
        title="Hasanat Distribution" 
        data={distribution}
        headers={["Student", "Class", "Faculty", "Distributed", "Redeemed", "Balance"]}
      />
      {distribution.length === 0 ? (
        <EmptyState icon={Star} title="No Hasanat data for selected filters" compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Student", "Class", "Faculty", "Distributed", "Redeemed", "Balance"].map((h) => (
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
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dashboard Main Widget</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Preview of widget rendering on the main landing dashboard</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HasanatChart />
        </div>
      </div>
    </div>
  );
}
