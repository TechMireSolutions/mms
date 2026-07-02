import React, { useMemo, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { STUDENTS_MODULE_CONTRACT } from "@mms/shared";
import type { Student } from '@/lib/data/studentsData';
import { useTranslation } from "@/hooks/useTranslation";
import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import {
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from "@/tenant/features/students/hooks/useStudents";
import ReportSummaryCard from "@/tenant/features/reports/components/ReportSummaryCard";
import ReportExportBar from "@/tenant/features/reports/components/ReportExportBar";
import { EmptyState } from "@/components/ui/EmptyState";

import EnrollmentChart from "@/tenant/features/dashboard/components/widgets/charts/EnrollmentChart";

/** Sub-tab labels available within the student report. */
const SUB_TABS = ["Student List", "Enrollment History"] as const;
type SubTab = (typeof SUB_TABS)[number];

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

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-success/10 text-success",
  inactive:  "bg-muted text-muted-foreground",
  suspended: "bg-warning/10 text-warning",
  completed: "bg-info/10 text-info",
  dropped:   "bg-destructive/10 text-destructive",
};

function mapStudentRow(student: Student): ReportStudent {
  let age = 0;
  if (student.dob) {
    const birthDate = new Date(student.dob);
    if (!isNaN(birthDate.getTime())) {
      age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    }
  }
  return {
    id: String(student.id),
    name: student.name,
    gender: student.gender || "male",
    status: student.status || "inactive",
    session: student.enrolledSessions?.[0] || "—",
    class: student.enrolledSessions?.[0] || "—",
    city: student.city || "—",
    registered: student.registeredDate || "—",
    age,
  };
}

export default function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("Student List");
  const [listPage, setListPage] = useState(1);

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
    status: filters.status !== "all" ? filters.status : undefined,
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
      enrolled: enrollment.enrolledDate,
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
        <ReportSummaryCard icon={Users}      label={t("students.report.totalStudents")} value={metrics?.total ?? 0}           color="primary" />
        <ReportSummaryCard icon={UserCheck}  label={t("students.report.active")}         value={metrics?.active ?? 0}          color="green"   />
        <ReportSummaryCard icon={UserX}      label={t("students.report.inactive")}       value={metrics?.inactive ?? 0}        color="red"     />
        <ReportSummaryCard icon={TrendingUp} label={t("students.report.genderSplit")}   value={`${male}M / ${female}F`}       color="blue"    />
      </div>

      <div className="flex border-b border-border gap-0">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "Student List" ? t("students.report.studentListTab") : t("students.report.enrollmentHistoryTab")}
          </button>
        ))}
      </div>

      <ReportExportBar 
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
                    {[
                      t("students.report.colName"),
                      t("students.report.colGender"),
                      t("students.report.colClass"),
                      t("students.report.colSession"),
                      t("students.report.colCity"),
                      t("students.report.colAge"),
                      t("students.report.colRegistered"),
                      t("students.report.colStatus"),
                    ].map((headerLabel) => (
                      <th key={headerLabel} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{student.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground capitalize">{student.gender}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{student.class}</td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{student.session}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{student.city}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{student.age}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{student.registered}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[student.status] ?? "bg-muted text-muted-foreground"}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(listPage > 1 || hasMoreStudents) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("students.report.paginationPageInfo", { page: listPage, total: studentsPage?.total ?? 0 })}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={listPage <= 1}
                    onClick={() => setListPage((currentPage) => Math.max(1, currentPage - 1))}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    {t("common.previous")}
                  </button>
                  <button
                    type="button"
                    disabled={!hasMoreStudents}
                    onClick={() => setListPage((currentPage) => currentPage + 1)}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {activeSubTab === "Enrollment History" && (
        enrollments.length === 0 ? (
          <EmptyState icon={Users} title={t("students.report.noEnrollmentsFound")} compact />
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm mt-4">
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
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[enrollment.status] ?? "bg-muted text-muted-foreground"}`}>
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
