import React, { useMemo } from "react";
import { CalendarCheck, Users, TrendingUp, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { SESSIONS_DATA, Session } from '@/lib/data/sessionsData';
import { STUDENTS, Student } from '@/lib/data/studentsData';
import { getCollection } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

import SessionsTable from "../dashboard/SessionsTable";

/** Active filter state passed down from the parent report view. */
interface SessionReportFilters {
  /** Selected session ID or "all" for no filter. */
  session: string;
}

/** Props for the SessionReport component. */
interface SessionReportProps {
  /** Active report filters. */
  filters: SessionReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

export interface SessionCapacityItem {
  session: string;
  class: string;
  enrolled: number;
  capacity: number;
  rate: number;
  status: string;
}

export interface EnrollmentTrendItem {
  month: string;
  students: number;
}

/** Bar chart data shape derived from session capacity records. */
interface CapacityBarDatum {
  class: string;
  enrolled: number;
  available: number;
}

/**
 * Returns the appropriate colour class for a utilisation rate progress bar.
 *
 * @param rate - The utilisation percentage (0–100).
 * @returns A Tailwind background colour class.
 */
function utilisationColour(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Renders session utilisation and capacity reports with stacked bar and
 * enrollment trend charts, plus a filterable session capacity table.
 *
 * @param props - The component props.
 * @returns The SessionReport component.
 */
export default function SessionReport({ filters }: SessionReportProps): React.JSX.Element {
  const sessions = useLiveCollection<Session>("sessions", SESSIONS_DATA);
  const students = useLiveCollection<Student>("students", STUDENTS);

  const sessionCapacity = useMemo<SessionCapacityItem[]>(() => {
    const list: SessionCapacityItem[] = [];
    sessions.forEach(s => {
      (s.classes || []).forEach(c => {
        list.push({
          session: s.name,
          class: c.name,
          enrolled: c.enrolled,
          capacity: c.capacity,
          rate: c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0,
          status: s.status
        });
      });
    });
    return list;
  }, [sessions]);

  const enrollmentTrends = useMemo<EnrollmentTrendItem[]>(() => {
    // Generate simple monthly trend from student registration dates
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.registeredDate) {
         // Using YYYY-MM prefix or just month name, here we map to short month to match UI mock format
         const d = new Date(s.registeredDate);
         if (!isNaN(d.getTime())) {
           const monthStr = d.toLocaleDateString("en-US", { month: "short" });
           counts[monthStr] = (counts[monthStr] || 0) + 1;
         }
      }
    });

    const orderedMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends: EnrollmentTrendItem[] = [];
    let cumulative = 0;
    orderedMonths.forEach(m => {
      if (counts[m] !== undefined) {
         cumulative += counts[m]; // Show cumulative growth or just monthly joins. Let's do monthly joins to match standard trend lines
         trends.push({ month: m, students: counts[m] });
      }
    });
    // Fallback if no dates parse correctly
    if (trends.length === 0) {
      return [{ month: "Jan", students: students.length }];
    }
    return trends;
  }, [students]);

  const capacityData = useMemo<SessionCapacityItem[]>(() => {
    let list = sessionCapacity;
    if (filters.session !== "all") {
      const targetSession = sessions.find(s => s.id === filters.session)?.name;
      if (targetSession) {
        list = list.filter((s) => s.session === targetSession);
      }
    }
    return list;
  }, [filters, sessionCapacity, sessions]);

  const totalEnrolled  = capacityData.reduce((a, s) => a + s.enrolled, 0);
  const totalCapacity  = capacityData.reduce((a, s) => a + s.capacity, 0);
  const avgUtil = capacityData.length
    ? (capacityData.reduce((a, s) => a + s.rate, 0) / capacityData.length).toFixed(1)
    : 0;

  const activeSessionsCount = sessions.filter(s => s.status === "active").length;

  const barData: CapacityBarDatum[] = capacityData.map((s) => ({
    class:     s.class,
    enrolled:  s.enrolled,
    available: s.capacity - s.enrolled,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={CalendarCheck} label="Active Sessions"  value={activeSessionsCount} color="primary" />
        <ReportSummaryCard icon={Users}         label="Total Enrolled"   value={totalEnrolled}    color="blue"    />
        <ReportSummaryCard icon={BarChart2}     label="Total Capacity"   value={totalCapacity}    color="violet"  />
        <ReportSummaryCard icon={TrendingUp}    label="Avg Utilisation"  value={`${avgUtil}%`}    color="green"   />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Capacity Utilisation by Class</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="enrolled"  fill="hsl(var(--primary))" stackId="a" name="Enrolled"  radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" fill="hsl(var(--muted))"   stackId="a" name="Available" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Enrollment Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="Students" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <ReportExportBar 
        title="Session Capacity Report" 
        data={capacityData}
        headers={["Session", "Class", "Enrolled", "Capacity", "Utilisation", "Status"]}
      />
      {capacityData.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No session data for selected filters" compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Session", "Class", "Enrolled", "Capacity", "Utilisation", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {capacityData.map((s, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">{s.session}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.class}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{s.enrolled}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.capacity}</td>
                  <td className="px-3 py-2.5 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-1.5 rounded-full ${utilisationColour(s.rate)}`}
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground">{s.rate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold capitalize">
                      {s.status}
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
        <SessionsTable />
      </div>
    </div>
  );
}
