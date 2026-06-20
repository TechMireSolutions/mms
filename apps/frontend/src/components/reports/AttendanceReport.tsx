import React, { useMemo } from "react";
import { UserCheck, Users, AlertTriangle, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useSessionsCollection } from "@/hooks/useSessions";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

import { AttendanceChart } from "@/components/widgets/charts/AttendanceChart";
import TodayAttendanceWidget from "@/components/widgets/TodayAttendanceWidget";
import { VisualizerConfig } from "./reportMetadata";

interface AttendanceReportProps {
  filters: {
    class: string;
    student: string;
  };
  onEditVisual: (config: VisualizerConfig) => void;
}

export interface AttendanceSummaryItem {
  class: string;
  total: number;
  avgRate: number;
  perfectAttendance: number;
  belowThreshold: number;
}

export interface StudentAttendanceItem {
  studentName: string;
  class: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

/**
 * Renders the attendance reports and metrics.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function AttendanceReport({ filters }: AttendanceReportProps): React.JSX.Element {
  const records = useAttendanceRecordsCollection();

  const sessions = useSessionsCollection();
  const allClasses = useMemo(() => sessions.flatMap(s => s.classes || []), [sessions]);

  const studentAtt = useMemo<StudentAttendanceItem[]>(() => {
    // Group records by student ID
    const grouped: Record<string, StudentAttendanceItem> = {};
    
    records.forEach(r => {
       const key = r.studentId;
       if (!grouped[key]) {
         // Resolve class name
         const cInfo = allClasses.find(c => c.id === r.classId);
         grouped[key] = {
           studentName: r.studentName,
           class: cInfo ? cInfo.name : r.classId,
           present: 0,
           absent: 0,
           late: 0,
           total: 0,
           rate: 0
         };
       }
       
       grouped[key].total++;
       if (r.status === "present" || r.status === "excused") grouped[key].present++;
       if (r.status === "absent") grouped[key].absent++;
       if (r.status === "late") {
         grouped[key].late++;
         grouped[key].present++; // Late is usually counted as present for general rating
       }
    });

    // Calculate rates
    const list = Object.values(grouped).map(s => {
       s.rate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
       return s;
     });

    let filtered = list;
    // Note: We use class name for filtering here to match UI text filter if it's name-based, or ID if it's ID-based.
    // Assuming filters.class is the class ID, we should probably group by classId internally, but for display we need name.
    // Let's refine the filter:
    if (filters.class !== "all") {
       const targetClass = allClasses.find(c => c.id === filters.class)?.name;
       if (targetClass) filtered = filtered.filter(s => s.class === targetClass);
    }
    if (filters.student) {
      filtered = filtered.filter((s) => s.studentName.toLowerCase().includes(filters.student.toLowerCase()));
    }
    return filtered;
  }, [filters, records, allClasses]);

  const summary = useMemo<AttendanceSummaryItem[]>(() => {
     const cGroup: Record<string, { totalStudents: number, sumRates: number, perfect: number, below: number }> = {};

     studentAtt.forEach(s => {
       if (!cGroup[s.class]) {
          cGroup[s.class] = { totalStudents: 0, sumRates: 0, perfect: 0, below: 0 };
       }
       cGroup[s.class].totalStudents++;
       cGroup[s.class].sumRates += s.rate;
       if (s.rate === 100) cGroup[s.class].perfect++;
       if (s.rate < 75) cGroup[s.class].below++;
     });

     return Object.entries(cGroup).map(([cName, data]) => ({
       class: cName,
       total: data.totalStudents,
       avgRate: data.totalStudents > 0 ? Math.round(data.sumRates / data.totalStudents) : 0,
       perfectAttendance: data.perfect,
       belowThreshold: data.below
     }));
  }, [studentAtt]);

  const avgRate = summary.length
    ? (summary.reduce((a, s) => a + s.avgRate, 0) / summary.length).toFixed(1)
    : "0";
    
  const perfect = summary.reduce((a, s) => a + s.perfectAttendance, 0);
  const belowThreshold = summary.reduce((a, s) => a + s.belowThreshold, 0);

  const rateColor = (rate: number): string => {
    if (rate >= 90) return "text-success";
    if (rate >= 75) return "text-warning";
    return "text-destructive";
  };

  const rateBar = (rate: number): React.JSX.Element => {
    const color = rate >= 90 ? "bg-success" : rate >= 75 ? "bg-warning" : "bg-destructive";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${rate}%` }} />
        </div>
        <span className={`text-xs font-bold ${rateColor(rate)}`}>{rate}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={UserCheck} label="Avg Attendance" value={`${avgRate}%`} color="green" />
        <ReportSummaryCard icon={Users} label="Classes" value={summary.length} color="primary" />
        <ReportSummaryCard icon={Award} label="Perfect Attendance" value={perfect} color="amber" />
        <ReportSummaryCard icon={AlertTriangle} label="Below 75%" value={belowThreshold} color="red" />
      </div>

      {/* Chart */}
      {summary.length > 0 && (
        <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Attendance Rate by Class</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="class" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => v !== undefined ? `${v}%` : ""} />
              <Bar dataKey="avgRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Class Summary Table */}
      <ReportExportBar 
        title="Attendance Summary" 
        data={summary}
        headers={["Class", "Total Students", "Avg Rate", "Perfect Attendance", "Below 75%"]}
      />
      {summary.length === 0 ? (
        <EmptyState icon={UserCheck} title="No attendance data" description="Adjust filters to view data." compact />
      ) : (
        <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Class", "Total Students", "Avg Rate", "Perfect Attendance", "Below 75%"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.map((s) => (
                <tr key={s.class} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium text-foreground">{s.class}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.total}</td>
                  <td className="px-3 py-3 w-44">{rateBar(s.avgRate)}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">{s.perfectAttendance}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold">{s.belowThreshold}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Attendance */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">Student Attendance Detail</h3>
        <ReportExportBar 
          title="Student Attendance Detail" 
          data={studentAtt}
          headers={["Student", "Class", "Present", "Absent", "Late", "Total", "Rate"]}
        />
      </div>
      {studentAtt.length === 0 ? (
        <EmptyState icon={Users} title="No student records" compact />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Student", "Class", "Present", "Absent", "Late", "Total", "Rate"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentAtt.map((s) => (
                <tr key={s.studentName} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium text-foreground">{s.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.class}</td>
                  <td className="px-3 py-2.5 text-success font-medium">{s.present}</td>
                  <td className="px-3 py-2.5 text-destructive font-medium">{s.absent}</td>
                  <td className="px-3 py-2.5 text-warning font-medium">{s.late}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.total}</td>
                  <td className="px-3 py-2.5 w-32">{rateBar(s.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dashboard widgets preview */}
      <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dashboard Main Widgets</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Preview of widgets rendering on the main landing dashboard</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AttendanceChart />
          <TodayAttendanceWidget />
        </div>
      </div>
    </div>
  );
}
