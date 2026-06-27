import React, { useMemo } from "react";
import { GraduationCap, BookOpen, Users, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { useSessionsCollection } from "@/hooks/useSessions";
import { useTeachersByIds } from '@/hooks/useTeachers';
import { collectTeacherIdsFromSessions } from '@/lib/registryResolve';
import { teacherNameById } from '@/lib/teachers/teacherAssignment';
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyWorkloadItem {
  faculty: string;
  classes: number;
  sessions: number;
  totalStudents: number;
  hoursPerWeek: number;
}

/** Active filter state passed down from the parent report view. */
interface FacultyReportFilters {
  [key: string]: string;
}

/** Props for the FacultyReport component. */
interface FacultyReportProps {
  /** Active report filters (currently unused but kept for API consistency). */
  filters?: FacultyReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

/**
 * Renders the faculty workload report including a summary KPI bar,
 * a horizontal bar chart of workload metrics, and a detailed data table.
 *
 * @param props - The component props.
 * @returns The FacultyReport component.
 */
export default function FacultyReport({ filters: _filters }: FacultyReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const teacherIds = useMemo(() => collectTeacherIdsFromSessions(sessions), [sessions]);
  const { data: teachers = [] } = useTeachersByIds(teacherIds);

  const resolveClassTeacher = (teacherId: string, teacherName: string): string => {
    const fromRegistry = teacherNameById(teachers, teacherId);
    return fromRegistry || teacherName || t("teachers.report.unassigned");
  };

  const facultyWorkload = useMemo<FacultyWorkloadItem[]>(() => {
    const map: Record<string, { classes: Set<string>, sessions: Set<string>, students: number, hours: number }> = {};
    sessions.forEach(s => {
       (s.classes || []).forEach(c => {
         const tName = resolveClassTeacher(c.teacherId, c.teacherName ?? '');
         if (!map[tName]) map[tName] = { classes: new Set(), sessions: new Set(), students: 0, hours: 0 };
         
         map[tName].classes.add(c.id);
         map[tName].sessions.add(s.id);
         map[tName].students += c.enrolled;
         map[tName].hours += 2; // Assuming 2 hours per class for mock workload calculation
       });
    });
    
    return Object.entries(map).map(([name, data]) => ({
      faculty: name,
      classes: data.classes.size,
      sessions: data.sessions.size,
      totalStudents: data.students,
      hoursPerWeek: data.hours
    })).sort((a, b) => b.totalStudents - a.totalStudents);
  }, [sessions, teachers]);

  const totalFaculty = facultyWorkload.length;
  const totalStudents = facultyWorkload.reduce((a, f) => a + f.totalStudents, 0);
  const totalHours = facultyWorkload.reduce((a, f) => a + f.hoursPerWeek, 0);
  const avgStudents = totalFaculty
    ? (totalStudents / totalFaculty).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={GraduationCap} label={t("teachers.report.totalFaculty")}        value={totalFaculty}          color="primary" />
        <ReportSummaryCard icon={Users}         label={t("teachers.report.totalStudents")}        value={totalStudents}         color="blue"    />
        <ReportSummaryCard icon={Clock}         label={t("teachers.report.weeklyHours")}          value={`${totalHours}h`}      color="violet"  />
        <ReportSummaryCard icon={BookOpen}      label={t("teachers.report.avgStudentsFaculty")}  value={avgStudents}           color="green"   />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-3">{t("teachers.report.workloadOverview")}</p>
        <SafeResponsiveContainer width="100%" height={200}>
          <BarChart data={facultyWorkload} barSize={28} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="faculty" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="totalStudents" fill="hsl(var(--primary))"  name={t("teachers.report.studentsLabel")}   radius={[0, 4, 4, 0]} />
            <Bar dataKey="hoursPerWeek"  fill="hsl(var(--chart-2))"  name={t("teachers.report.hoursWeekLabel")} radius={[0, 4, 4, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </div>

      {/* Table */}
      <ReportExportBar 
        title={t("teachers.report.workloadReportTitle")} 
        data={facultyWorkload}
        headers={[
          t("teachers.report.colFaculty"),
          t("teachers.report.colClasses"),
          t("teachers.report.colSessions"),
          t("teachers.report.colStudents"),
          t("teachers.report.colHoursWeek"),
        ]}
      />
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {[
                t("teachers.report.colFaculty"),
                t("teachers.report.colClasses"),
                t("teachers.report.colSessions"),
                t("teachers.report.colStudents"),
                t("teachers.report.colHoursWeek"),
              ].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {facultyWorkload.map((f) => (
              <tr key={f.faculty} className="hover:bg-muted/30">
                <td className="px-3 py-3 font-medium">{f.faculty}</td>
                <td className="px-3 py-3 text-muted-foreground">{f.classes}</td>
                <td className="px-3 py-3 text-muted-foreground">{f.sessions}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{f.totalStudents}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(f.hoursPerWeek / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{f.hoursPerWeek}h</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
