import React, { useMemo, useCallback, useState } from "react";
import { GraduationCap, BookOpen, Users, Clock, Filter, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { collectTeacherIdsFromSessions } from '@/lib/registryResolve';
import { teacherNameById } from '@/lib/teachers/teacherAssignment';
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
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
  const filteredFacultyWorkload = useMemo(
    () => (
      selectedFaculty
        ? facultyWorkload.filter((facultyItem) => facultyItem.faculty === selectedFaculty)
        : facultyWorkload
    ),
    [facultyWorkload, selectedFaculty],
  );
  const toggleFacultyFilter = (faculty: string) => {
    setSelectedFaculty((current) => (current === faculty ? null : faculty));
  };

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
          <BarChart
            data={facultyWorkload}
            barSize={28}
            layout="vertical"
            onClick={(state) => {
              const faculty = (
                state as { activePayload?: Array<{ payload?: { faculty?: string } }> } | undefined
              )?.activePayload?.[0]?.payload?.faculty;
              if (typeof faculty === "string" && faculty.length > 0) toggleFacultyFilter(faculty);
            }}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="faculty" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="totalStudents" fill="hsl(var(--primary))"  name={t("teachers.report.studentsLabel")}   radius={[0, 4, 4, 0]} />
            <Bar dataKey="hoursPerWeek"  fill="hsl(var(--chart-2))"  name={t("teachers.report.hoursWeekLabel")} radius={[0, 4, 4, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </SectionCard>

      {selectedFaculty && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{t("teachers.report.facultyFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {selectedFaculty}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFaculty(null)}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="me-1 h-3 w-3" />
            {t("teachers.report.clearFacultyFilter")}
          </Button>
        </div>
      )}

      {/* Table */}
      <ExportToolbar 
        title={t("teachers.report.workloadReportTitle")} 
        data={filteredFacultyWorkload}
        headers={[
          t("teachers.report.colFaculty"),
          t("teachers.report.colClasses"),
          t("teachers.report.colSessions"),
          t("teachers.report.colStudents"),
          t("teachers.report.colHoursWeek"),
        ]}
      />
      {filteredFacultyWorkload.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t("teachers.report.noFacultyData")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {filteredFacultyWorkload.map((faculty) => (
              <article
                key={faculty.faculty}
                className={`space-y-3 rounded-xl border border-border bg-card p-3 ${selectedFaculty === faculty.faculty ? "ring-1 ring-primary/20" : ""}`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleFacultyFilter(faculty.faculty)}
                  className={`h-auto min-h-11 px-0 py-0 text-sm font-semibold hover:bg-transparent hover:text-foreground ${
                    selectedFaculty === faculty.faculty ? "text-primary" : "text-foreground"
                  }`}
                >
                  {faculty.faculty}
                </Button>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colClasses")}</dt>
                    <dd className="text-foreground">{faculty.classes}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colSessions")}</dt>
                    <dd className="text-foreground">{faculty.sessions}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colStudents")}</dt>
                    <dd className="font-semibold text-foreground">{faculty.totalStudents}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colHoursWeek")}</dt>
                    <dd>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${(faculty.hoursPerWeek / 12) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{faculty.hoursPerWeek}h</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
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
                  <th key={heading} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFacultyWorkload.map((faculty) => (
                <tr
                  key={faculty.faculty}
                  className={`hover:bg-muted/30 ${selectedFaculty === faculty.faculty ? "bg-primary/10" : ""}`}
                >
                  <td className="px-3 py-3 font-medium">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleFacultyFilter(faculty.faculty)}
                      className={`h-auto px-0 py-0 font-medium hover:bg-transparent hover:text-foreground ${
                        selectedFaculty === faculty.faculty ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {faculty.faculty}
                    </Button>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{faculty.classes}</td>
                  <td className="px-3 py-3 text-muted-foreground">{faculty.sessions}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">{faculty.totalStudents}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted">
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
          </div>
        </Card>
      )}
    </div>
  );
}
