import React, { useMemo, useCallback } from "react";
import { GraduationCap, BookOpen, Users, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { useTeachersByIds } from '@/tenant/features/teachers/hooks/useTeachers';
import { collectTeacherIdsFromSessions } from '@/lib/registryResolve';
import { teacherNameById } from '@/lib/teachers/teacherAssignment';
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
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

  const resolveClassTeacher = useCallback((teacherId: string, teacherName: string): string => {
    const fromRegistry = teacherNameById(teachers, teacherId);
    return fromRegistry || teacherName || t("teachers.report.unassigned");
  }, [teachers, t]);

  const facultyWorkload = useMemo<FacultyWorkloadItem[]>(() => {
    const workloadByTeacherName: Record<string, { classes: Set<string>, sessions: Set<string>, students: number, hours: number }> = {};
    sessions.forEach((session) => {
       (session.classes || []).forEach((sessionClass) => {
         const teacherName = resolveClassTeacher(sessionClass.teacherId, sessionClass.teacherName ?? '');
         if (!workloadByTeacherName[teacherName]) workloadByTeacherName[teacherName] = { classes: new Set(), sessions: new Set(), students: 0, hours: 0 };
         
         workloadByTeacherName[teacherName].classes.add(sessionClass.id);
         workloadByTeacherName[teacherName].sessions.add(session.id);
         workloadByTeacherName[teacherName].students += sessionClass.enrolled;
         workloadByTeacherName[teacherName].hours += 2; // Assuming 2 hours per class for mock workload calculation
       });
    });
    
    return Object.entries(workloadByTeacherName).map(([teacherName, workload]) => ({
      faculty: teacherName,
      classes: workload.classes.size,
      sessions: workload.sessions.size,
      totalStudents: workload.students,
      hoursPerWeek: workload.hours
    })).sort((firstFaculty, secondFaculty) => secondFaculty.totalStudents - firstFaculty.totalStudents);
  }, [sessions, resolveClassTeacher]);

  const totalFaculty = facultyWorkload.length;
  const totalStudents = facultyWorkload.reduce((total, faculty) => total + faculty.totalStudents, 0);
  const totalHours = facultyWorkload.reduce((total, faculty) => total + faculty.hoursPerWeek, 0);
  const avgStudents = totalFaculty
    ? (totalStudents / totalFaculty).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={GraduationCap} label={t("teachers.report.totalFaculty")}        value={totalFaculty}          color="primary" />
        <StatCard icon={Users}         label={t("teachers.report.totalStudents")}        value={totalStudents}         color="blue"    />
        <StatCard icon={Clock}         label={t("teachers.report.weeklyHours")}          value={`${totalHours}h`}      color="violet"  />
        <StatCard icon={BookOpen}      label={t("teachers.report.avgStudentsFaculty")}  value={avgStudents}           color="green"   />
      </div>

      {/* Chart */}
      <SectionCard title={t("teachers.report.workloadOverview")}>
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
      </SectionCard>

      {/* Table */}
      <ExportToolbar 
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
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {[
                t("teachers.report.colFaculty"),
                t("teachers.report.colClasses"),
                t("teachers.report.colSessions"),
                t("teachers.report.colStudents"),
                t("teachers.report.colHoursWeek"),
              ].map((heading) => (
                <th key={heading} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {facultyWorkload.map((faculty) => (
              <tr key={faculty.faculty} className="hover:bg-muted/30">
                <td className="px-3 py-3 font-medium">{faculty.faculty}</td>
                <td className="px-3 py-3 text-muted-foreground">{faculty.classes}</td>
                <td className="px-3 py-3 text-muted-foreground">{faculty.sessions}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{faculty.totalStudents}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(faculty.hoursPerWeek / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{faculty.hoursPerWeek}h</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </Card>
    </div>
  );
}
