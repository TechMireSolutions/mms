import React, { useMemo } from "react";
import { UserCheck, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { AttendanceStatus } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useAttendanceConfig";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useSessionsCollection } from "@/hooks/useSessions";
// Type definitions
interface ClassInfo {
  id: string;
  name: string;
}

interface Session {
  id: string;
  name: string;
  classes?: ClassInfo[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  studentId: string;
  status: "present" | "absent" | "late" | "excused" | string;
}

interface ClassBreakdown {
  classId: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

/**
 * TodayAttendanceWidget
 * 
 * Displays a summary of attendance records for the current day or the most recent day.
 * Includes overall statistics, status counts, and a breakdown by class.
 * 
 * @returns {React.ReactElement} The rendered widget component.
 */
export default function TodayAttendanceWidget({ title }: { title?: string }) {
  const { statuses } = useAttendanceConfig();
  const attendanceRecords = useAttendanceRecordsCollection();
  const sessions = useSessionsCollection();

  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const today = new Date().toISOString().slice(0, 10);

  const todayRecords = useMemo(() =>
    attendanceRecords.filter((r) => r.date === today),
    [attendanceRecords, today]
  );

  // Use most recent date if no records today (demo data)
  const displayRecords = useMemo(() => {
    if (todayRecords.length > 0) return todayRecords;
    const dates = Array.from(new Set(attendanceRecords.map((r) => r.date))).sort().reverse();
    return dates.length > 0 ? attendanceRecords.filter((r) => r.date === dates[0]) : [];
  }, [todayRecords, attendanceRecords]);

  const displayDate = displayRecords.length > 0 ? displayRecords[0].date : today;
  const isToday = displayDate === today;

  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: displayRecords.length };
    displayRecords.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [displayRecords]);

  const rate = stats.total ? Math.round((((stats.present || 0) + (stats.late || 0)) / stats.total) * 100) : 0;

  // Per-class breakdown
  const classBreakdown = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    displayRecords.forEach((r) => {
      if (!map[r.classId]) map[r.classId] = { total: 0 };
      map[r.classId][r.status] = (map[r.classId][r.status] || 0) + 1;
      map[r.classId].total++;
    });
    return Object.entries(map).map(([classId, s]) => ({
      classId,
      name: allClasses.find((c) => c.id === classId)?.name || classId,
      present: s.present || 0,
      absent: s.absent || 0,
      late: s.late || 0,
      excused: s.excused || 0,
      total: s.total,
      rate: s.total ? Math.round((((s.present || 0) + (s.late || 0)) / s.total) * 100) : 0,
    })) as ClassBreakdown[];
  }, [displayRecords, allClasses]);

  const rateColor = rate >= 90 ? "text-success" : rate >= 75 ? "text-warning" : "text-destructive";
  const rateBarColor = rate >= 90 ? "bg-success" : rate >= 75 ? "bg-warning" : "bg-destructive";

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            {title || (isToday ? "Today's" : "Latest") + " Attendance Summary"}
          </h2>
          {!isToday && (
            <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted font-medium">{displayDate}</span>
          )}
        </div>
        <Link to={ROUTES.attendance} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <section className="p-4 space-y-4">
        {displayRecords.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No attendance recorded today</p>
            <Link to={ROUTES.attendance} className="text-xs text-primary font-semibold hover:underline mt-1 inline-block">Mark Attendance →</Link>
          </div>
        ) : (
          <>
            {/* Overall rate */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Overall Rate</span>
                  <span className={`text-sm font-bold ${rateColor}`}>{rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${rateBarColor} transition-all`} style={{ width: `${rate}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${rateColor}`}>{rate}%</p>
                <p className="text-[11px] text-muted-foreground">{stats.total} students</p>
              </div>
            </div>

            {/* Status pills */}
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${statuses.length || 4}, minmax(0, 1fr))` }}
            >
              {statuses.map((s: AttendanceStatus) => {
                const count = stats[s.id] || 0;
                return (
                  <div key={s.id} className={`rounded-xl ${s.bg} ${s.text} border ${s.border} px-2 py-2 text-center`}>
                    <p className="text-base font-bold">{count}</p>
                    <p className="text-[10px] font-semibold">{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Alert if high absence */}
            {(stats.absent || 0) > 2 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {stats.absent} student{(stats.absent || 0) > 1 ? "s" : ""} absent today — review needed
              </div>
            )}

            {/* Class breakdown */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">By Class</h3>
              {classBreakdown.map((c) => (
                <div key={c.classId} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground w-28 truncate">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${c.rate >= 90 ? "bg-success" : c.rate >= 75 ? "bg-warning" : "bg-destructive"}`}
                      style={{ width: `${c.rate}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${c.rate >= 90 ? "text-success" : c.rate >= 75 ? "text-warning" : "text-destructive"}`}>{c.rate}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </article>
  );
}
