import React, { useMemo, useState } from "react";
import { SubTabBar, type SubTab as UINavTab } from "@/components/ui/SubTabBar";
import { Users, UserCheck, UserX, TrendingUp, Filter, X } from "lucide-react";
import { STUDENTS_MODULE_CONTRACT, type Student, calcAge, formatDate, toTitleCase } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import {
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from "@/tenant/features/students/hooks/useStudents";
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListPagination } from "@/components/ui/ListPagination";
import { Button } from "@/components/ui/button";

import EnrollmentChart from "@/components/dashboard-widgets/charts/EnrollmentChart";

/** Sub-tab labels available within the student report. */
const _SUB_TABS = ["Student List", "Enrollment History"] as const;
type SubTab = (typeof _SUB_TABS)[number];

export interface ReportStudent {
  id: string;
  name: string;
  gender: string;
  status: string;
  session: string;
  class: string;
  city: string;
  registered: string;
  age: number;
}

export interface EnrollmentHistoryItem {
  id: string;
  studentName: string;
  session: string;
  class: string;
  enrolled: string;
  status: string;
}

/** Active filter state passed down from the parent report view. */
interface StudentReportFilters {
  status: string;
  class: string;
  student: string;
}

/** Props for the StudentReport component. */
interface StudentReportProps {
  filters: StudentReportFilters;
  onEditVisual?: (config: unknown) => void;
}


function mapStudentRow(student: Student): ReportStudent {
  const age = calcAge(student.dob) ?? 0;
  return {
    id: String(student.id),
    name: student.name || "",
    gender: student.gender || "male",
    status: student.status || "inactive",
    session: student.enrolledSessions?.[0] || "—",
    class: student.enrolledSessions?.[0] || "—",
    city: student.city || "—",
    registered: student.registeredDate ? formatDate(student.registeredDate, true) : "—",
    age,
  };
}

export default function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("Student List");

  const REPORT_TABS = useMemo<readonly UINavTab<SubTab>[]>(
    () => [
      { key: "Student List", label: t("students.report.studentListTab") },
      { key: "Enrollment History", label: t("students.report.enrollmentHistoryTab") },
    ],
    [t]
  );
  const [listPage, setListPage] = useState(1);

  const [reportStatusFilter, setReportStatusFilter] = useState<string | null>(null);

  const { data: metrics } = useStudentsMetrics();
  const { data: genderAggregates } = useStudentsWidgetAggregates([
    {
      id: "male",
      collection: "students",
      operation: "count",
      filterField: "gender",
      filterOperator: "equals",
      filterValue: "male",
    },
    {
      id: "female",
      collection: "students",
      operation: "count",
      filterField: "gender",
      filterOperator: "equals",
      filterValue: "female",
    },
  ]);

  const { data: studentsPage } = useStudentsPaginated({
    page: listPage,
    limit: STUDENTS_MODULE_CONTRACT.defaultPageSize,
    search: filters.student || undefined,
    status: reportStatusFilter || (filters.status !== "all" ? filters.status : undefined),
  });

  const enrollmentRecords = useEnrollmentsCollection();

  const students = useMemo<ReportStudent[]>(() => {
    const studentRows = (studentsPage?.students ?? []) as unknown as Student[];
    let filteredStudents = studentRows.map(mapStudentRow);
    if (filters.class && filters.class !== "all") {
      filteredStudents = filteredStudents.filter((student) => student.class === filters.class);
    }
    return filteredStudents;
  }, [studentsPage, filters.class]);

  const enrollments = useMemo<EnrollmentHistoryItem[]>(() => {
    let filteredEnrollments = enrollmentRecords.map((enrollment) => ({
      id: enrollment.id,
      studentName: enrollment.studentName,
      session: enrollment.sessionName,
      class: enrollment.className || "—",
      enrolled: formatDate(enrollment.enrolledDate),
      status: enrollment.status,
    }));
    if (filters.student) {
      filteredEnrollments = filteredEnrollments.filter((enrollment) =>
        enrollment.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return filteredEnrollments;
  }, [enrollmentRecords, filters.student]);

  const male = genderAggregates?.male?.value ?? 0;
  const female = genderAggregates?.female?.value ?? 0;
  const hasMoreStudents = Boolean(studentsPage?.hasMore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label={t("students.report.totalStudents")}
          value={metrics?.total ?? 0}
          color="primary"
          isActive={!reportStatusFilter}
          onClick={() => { setReportStatusFilter(null); setActiveSubTab("Student List"); }}
        />
        <StatCard
          icon={UserCheck}
          label={t("students.report.active")}
          value={metrics?.active ?? 0}
          color="green"
          isActive={reportStatusFilter === "active"}
          onClick={() => { setReportStatusFilter(reportStatusFilter === "active" ? null : "active"); setActiveSubTab("Student List"); }}
        />
        <StatCard
          icon={UserX}
          label={t("students.report.inactive")}
          value={metrics?.inactive ?? 0}
          color="red"
          isActive={reportStatusFilter === "inactive"}
          onClick={() => { setReportStatusFilter(reportStatusFilter === "inactive" ? null : "inactive"); setActiveSubTab("Student List"); }}
        />
        <StatCard
          icon={TrendingUp}
          label={t("students.report.genderSplit")}
          value={`${male}M / ${female}F`}
          color="blue"
          onClick={() => { setActiveSubTab("Student List"); }}
        />
      </div>

      {(reportStatusFilter || (filters.status && filters.status !== "all") || filters.student) && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">Filter:</span>
            {reportStatusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                {toTitleCase(reportStatusFilter)}
              </span>
            )}
            {filters.student && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                "{filters.student}"
              </span>
            )}
          </div>
          {reportStatusFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReportStatusFilter(null)}
              className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 me-1" />
              Clear Filter
            </Button>
          )}
        </div>
      )}

      <SubTabBar
        tabs={REPORT_TABS}
        value={activeSubTab}
        onChange={setActiveSubTab}
        panelIdPrefix="student-report-subtab"
      />

      <ExportToolbar 
        title={activeSubTab === "Student List" ? t("students.report.studentListTab") : t("students.report.enrollmentHistoryTab")} 
        data={activeSubTab === "Student List" ? students : enrollments}
        headers={activeSubTab === "Student List" 
          ? [
              t("students.report.colName"),
              t("students.report.colGender"),
              t("students.report.colClass"),
              t("students.report.colSession"),
              t("students.report.colCity"),
              t("students.report.colAge"),
              t("students.report.colRegistered"),
              t("students.report.colStatus"),
            ]
          : [
              t("students.report.colStudent"),
              t("students.report.colSession"),
              t("students.report.colClass"),
              t("students.report.colEnrolled"),
              t("students.report.colStatus"),
            ]
        }
      />

      {activeSubTab === "Student List" && (
        students.length === 0 ? (
          <EmptyState icon={Users} title={t("students.report.noStudentsFound")} description={t("students.report.adjustFilters")} compact />
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("students.report.colName")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("students.report.colGender")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("students.report.colClass")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("students.report.colSession")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("students.report.colCity")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("students.report.colAge")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("students.report.colRegistered")}</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("students.report.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{student.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{toTitleCase(student.gender)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{student.class}</td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate hidden md:table-cell">{student.session}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{student.city}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{student.age}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{student.registered}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={student.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {studentsPage && (
              <ListPagination
                page={listPage}
                total={studentsPage.total}
                limit={STUDENTS_MODULE_CONTRACT.defaultPageSize}
                hasMore={hasMoreStudents}
                onPageChange={setListPage}
                i18nNamespace="students"
                variant="range"
              />
            )}
          </div>
        )
      )}

      {activeSubTab === "Enrollment History" && (
        enrollments.length === 0 ? (
          <EmptyState icon={Users} title={t("students.report.noEnrollmentsFound")} compact />
        ) : (
          <Card className="overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  {[
                    t("students.report.colStudent"),
                    t("students.report.colSession"),
                    t("students.report.colClass"),
                    t("students.report.colEnrolled"),
                    t("students.report.colStatus"),
                  ].map((headerLabel) => (
                    <th key={headerLabel} className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{headerLabel}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{enrollment.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{enrollment.session}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{enrollment.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{enrollment.enrolled}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={enrollment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}

      <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("students.report.dashboardWidgetsTitle")}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("students.report.dashboardWidgetsSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnrollmentChart />
        </div>
      </div>
    </div>
  );
}
