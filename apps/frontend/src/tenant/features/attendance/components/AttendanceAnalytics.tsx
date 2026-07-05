import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  calcClassStats, calcStudentRate, getMonthlyTrend, AttendanceRecord,
  AttendanceStatus,
} from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/tenant/features/attendance/hooks/useAttendanceConfig";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useStudentsByIds } from '@/tenant/features/students/hooks/useStudents';
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
    <Card className="p-4 flex items-center gap-3 relative overflow-hidden group/stat-card shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/stat-card:bg-primary" />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} ml-1`}>
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
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
export function AttendanceAnalytics({ filters, records }: AttendanceAnalyticsProps) {
  const { statuses } = useAttendanceConfig();
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(
    () => [primary, charts[0], secondary, charts[3]],
    [primary, secondary, charts],
  );
  const sessions = useSessionsCollection();
  const enrollments = useLiveCollection<Enrollment>("enrollments");
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const classesToShow = filters.classId
    ? allClasses.filter((sessionClass) => sessionClass.id === filters.classId)
    : allClasses;

  const classStats = useMemo(() =>
    classesToShow.map((sessionClass) => ({
      name: sessionClass.name,
      ...calcClassStats(sessionClass.id, records),
    })),
    [classesToShow, records]
  );

  const totalStats = useMemo(() => {
    return classStats.reduce(
      (totals, classStat) => {
        Object.keys(classStat).forEach((key) => {
          if (key !== "name" && key !== "rate") {
            totals[key] = (totals[key] || 0) + (classStat[key as keyof typeof classStat] as number || 0);
          }
        });
        return totals;
      },
      {} as Record<string, number>
    );
  }, [classStats]);

  const overallRate = useMemo(() => {
    const totalPresent = (totalStats.present || 0) + (totalStats.late || 0);
    const totalAll = Object.keys(totalStats).reduce((sum, key) => sum + (totalStats[key] || 0), 0);
    return totalAll ? Math.round((totalPresent / totalAll) * 100) : 0;
  }, [totalStats]);

  // Monthly trend (pick selected class or the first available tenant class)
  const trendClassId = filters.classId || classesToShow[0]?.id || "";
  const monthlyTrend = useMemo(() => getMonthlyTrend(trendClassId, records), [trendClassId, records]);

  const studentIds = useMemo(() => {
    if (!trendClassId) return [];
    return enrollments
      .filter((enrollment) =>
        enrollment.classId === trendClassId &&
        enrollment.status !== "cancelled" &&
        enrollment.status !== "completed"
      )
      .map((enrollment) => enrollment.studentId);
  }, [enrollments, trendClassId]);

  const { data: students = [] } = useStudentsByIds(studentIds);

  /** Abbreviated name + attendance rate entry for chart display. */
  interface StudentRateEntry { name: string; rate: number; }

  const studentRates = useMemo<StudentRateEntry[]>(() =>
    students.map((student) => ({
      name: student.name.split(" ")[0] + " " + (student.name.split(" ")[1]?.[0] ?? "") + ".",
      rate: calcStudentRate(student.id, records),
    })).sort((firstStudent, secondStudent) => firstStudent.rate - secondStudent.rate),
    [students, records]
  );

  const lowAttendance = studentRates.filter((studentRate) => studentRate.rate < 75);
  const topStudents = [...studentRates].sort((firstStudent, secondStudent) => secondStudent.rate - firstStudent.rate).slice(0, 3);

  // Pie data
  const pieData = useMemo(() =>
    statuses.map((status: AttendanceStatus) => ({
      name: status.label,
      value: totalStats[status.id] ?? 0,
    })),
    [statuses, totalStats]
  );

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
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Attendance % by Class</h2>
          <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={classStats} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" name="Attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (value) => value !== undefined && value !== null ? `${value}%` : "" }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly trend */}
        <Card accentColor="info" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
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
              <Tooltip formatter={(value) => `${value}%`} />
              <Area type="monotone" dataKey="rate" name="Attendance%" stroke="hsl(var(--primary))" fill="url(#att-grad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Student rates */}
        <Card accentColor="indigo" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Student Attendance Rates</h2>
          <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={studentRates} layout="vertical" barSize={12}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" name="Rate" radius={[0, 4, 4, 0]}
                fill="hsl(var(--primary))"
                background={{ fill: "hsl(var(--muted))", radius: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie */}
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">Status Distribution</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statuses.map((status: AttendanceStatus, index: number) => (
                <div key={status.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{status.label}</span>
                  <span className="font-bold text-foreground ml-auto">{totalStats[status.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Low attendance alerts */}
      {lowAttendance.length > 0 && (
        <article className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
            <h3 className="text-sm font-bold text-warning m-0">Low Attendance Alert — {lowAttendance.length} student{lowAttendance.length > 1 ? "s" : ""} below 75%</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowAttendance.map((studentRate) => (
              <div key={studentRate.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/45 backdrop-blur-sm border border-warning/30">
                <span className="text-xs font-semibold text-foreground">{studentRate.name}</span>
                <span className="text-[11px] font-bold text-destructive">{studentRate.rate}%</span>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Top performers */}
      <Card accentColor="success" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
        <h2 className="text-sm font-bold text-foreground mb-3 m-0">Top Performers</h2>
        <div className="space-y-2">
          {topStudents.map((studentRate, index) => (
            <div key={studentRate.name} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${index === 0 ? "bg-warning/15 text-warning" : index === 1 ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning"}`}>{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{studentRate.name}</span>
                  <span className="text-xs font-bold text-success">{studentRate.rate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: `${studentRate.rate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
