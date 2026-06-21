import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  calcClassStats, calcStudentRate, getMonthlyTrend, ATTENDANCE_STATUSES, AttendanceRecord,
  AttendanceStatus,
} from '@/lib/data/attendanceData';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useStudentsCollection } from '@/hooks/useStudents';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import type { Enrollment } from '@/lib/data/enrollmentData';
import { AlertTriangle, TrendingDown, Award } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, sub, icon: Icon, color }: StatCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </article>
  );
}

interface AnalyticsFilters {
  classId?: string;
}

interface AttendanceAnalyticsProps {
  filters: AnalyticsFilters;
  records: AttendanceRecord[];
}

/**
 * AttendanceAnalytics
 * 
 * Displays various charts and KPIs related to attendance records.
 * Provides insights such as overall rate, monthly trends, and status distribution.
 * 
 * @param {AttendanceAnalyticsProps} props - The component props.
 * @returns {React.ReactElement} The rendered analytics dashboard.
 */
export default function AttendanceAnalytics({ filters, records }: AttendanceAnalyticsProps) {
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(
    () => [primary, charts[0], secondary, charts[3]],
    [primary, secondary, charts],
  );
  const sessions = useSessionsCollection();
  const enrollments = useLiveCollection<Enrollment>("enrollments");
  const allStudents = useStudentsCollection();
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const classesToShow = filters.classId
    ? allClasses.filter((c) => c.id === filters.classId)
    : allClasses;

  const classStats = useMemo(() =>
    classesToShow.map((c) => ({
      name: c.name,
      ...calcClassStats(c.id, records),
    })),
    [classesToShow, records]
  );

  const overallRate = useMemo(() => {
    const totalPresent = classStats.reduce((s, c) => s + c.present + c.late, 0);
    const totalAll = classStats.reduce((s, c) => s + c.present + c.absent + c.late + c.excused, 0);
    return totalAll ? Math.round((totalPresent / totalAll) * 100) : 0;
  }, [classStats]);

  // Monthly trend (pick selected class or the first available tenant class)
  const trendClassId = filters.classId || classesToShow[0]?.id || "";
  const monthlyTrend = useMemo(() => getMonthlyTrend(trendClassId, records), [trendClassId, records]);

  // Student rates for first class
  const students = useMemo(() => {
    if (!trendClassId) return [];
    const studentIds = new Set(
      enrollments
        .filter((enrollment) =>
          enrollment.classId === trendClassId &&
          enrollment.status !== "cancelled" &&
          enrollment.status !== "completed"
        )
        .map((enrollment) => String(enrollment.studentId)),
    );
    return allStudents.filter((student) => studentIds.has(String(student.id)));
  }, [allStudents, enrollments, trendClassId]);

  /** Abbreviated name + attendance rate entry for chart display. */
  interface StudentRateEntry { name: string; rate: number; }

  const studentRates = useMemo<StudentRateEntry[]>(() =>
    students.map((st) => ({
      name: st.name.split(" ")[0] + " " + (st.name.split(" ")[1]?.[0] ?? "") + ".",
      rate: calcStudentRate(st.id, records),
    })).sort((a, b) => a.rate - b.rate),
    [students, trendClassId, records]
  );

  const lowAttendance = studentRates.filter((s) => s.rate < 75);
  const topStudents = [...studentRates].sort((a, b) => b.rate - a.rate).slice(0, 3);

  // Pie data
  const totalStats = classStats.reduce(
    (acc, c) => ({ present: acc.present + c.present, absent: acc.absent + c.absent, late: acc.late + c.late, excused: acc.excused + c.excused }),
    { present: 0, absent: 0, late: 0, excused: 0 }
  );

  const pieData = ATTENDANCE_STATUSES.map((s: AttendanceStatus) => ({
    name: s.label,
    value: totalStats[s.id as keyof typeof totalStats] ?? 0,
  }));

  return (
    <section className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Overall Attendance" value={`${overallRate}%`} sub="All classes" icon={Award} color="bg-success" />
        <StatCard label="Total Present"   value={totalStats.present} sub="Across all records" icon={Award}         color="bg-primary"       />
        <StatCard label="Low Attendance"  value={lowAttendance.length} sub="Below 75%"         icon={AlertTriangle} color="bg-warning"     />
        <StatCard label="Most Absent"     value={studentRates[0]?.name || "—"} sub={`${studentRates[0]?.rate || 0}%`} icon={TrendingDown} color="bg-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Class attendance rate bar chart */}
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Attendance % by Class</h2>
          <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={classStats} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (v) => v !== undefined && v !== null ? `${v}%` : "" }} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        {/* Monthly trend */}
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Monthly Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="att-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Area type="monotone" dataKey="rate" name="Attendance%" stroke="hsl(var(--primary))" fill="url(#att-grad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        {/* Student rates */}
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Student Attendance Rates</h2>
          <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={studentRates} layout="vertical" barSize={12}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Rate" radius={[0, 4, 4, 0]}
                fill="hsl(var(--primary))"
                background={{ fill: "hsl(var(--muted))", radius: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        {/* Pie */}
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Status Distribution</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {ATTENDANCE_STATUSES.map((s: AttendanceStatus, i: number) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-bold text-foreground ml-auto">{totalStats[s.id as keyof typeof totalStats] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Low attendance alerts */}
      {lowAttendance.length > 0 && (
        <article className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
            <h3 className="text-sm font-bold text-warning m-0">Low Attendance Alert — {lowAttendance.length} student{lowAttendance.length > 1 ? "s" : ""} below 75%</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowAttendance.map((s) => (
              <div key={s.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-warning/30">
                <span className="text-xs font-semibold text-foreground">{s.name}</span>
                <span className="text-[11px] font-bold text-destructive">{s.rate}%</span>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Top performers */}
      <article className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3 m-0">Top Performers</h2>
        <div className="space-y-2">
          {topStudents.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? "bg-warning/15 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning"}`}>{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="text-xs font-bold text-success">{s.rate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: `${s.rate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
