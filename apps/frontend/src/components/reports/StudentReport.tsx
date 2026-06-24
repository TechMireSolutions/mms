import React, { useMemo, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { STUDENTS_MODULE_CONTRACT } from "@mms/shared";
import type { Student } from '@/lib/data/studentsData';
import type { Enrollment } from '@/lib/data/enrollmentData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import {
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from "../../hooks/useStudents";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

import EnrollmentChart from "@/components/widgets/charts/EnrollmentChart";

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

function mapStudentRow(s: Student): ReportStudent {
  let age = 0;
  if (s.dob) {
    const d = new Date(s.dob);
    if (!isNaN(d.getTime())) {
      age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    }
  }
  return {
    id: String(s.id),
    name: s.name,
    gender: s.gender || "male",
    status: s.status || "inactive",
    session: s.enrolledSessions?.[0] || "—",
    class: s.enrolledSessions?.[0] || "—",
    city: s.city || "—",
    registered: s.registeredDate || "—",
    age,
  };
}

export default function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const [sub, setSub] = useState<SubTab>("Student List");
  const [listPage, setListPage] = useState(1);

  const { data: metrics } = useStudentsMetrics();
  const { data: genderAgg } = useStudentsWidgetAggregates([
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

  const { data: studentPage } = useStudentsPaginated({
    page: listPage,
    limit: STUDENTS_MODULE_CONTRACT.defaultPageSize,
    search: filters.student || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
  });

  const enrollmentRecords = useLiveCollection<Enrollment>("enrollments");

  const students = useMemo<ReportStudent[]>(() => {
    const rows = (studentPage?.students ?? []) as unknown as Student[];
    let list = rows.map(mapStudentRow);
    if (filters.class && filters.class !== "all") {
      list = list.filter((s) => s.class === filters.class);
    }
    return list;
  }, [studentPage, filters.class]);

  const enrollments = useMemo<EnrollmentHistoryItem[]>(() => {
    let list = enrollmentRecords.map((e) => ({
      id: e.id,
      studentName: e.studentName,
      session: e.sessionName,
      class: e.className || "—",
      enrolled: e.enrolledDate,
      status: e.status,
    }));
    if (filters.student) {
      list = list.filter((e) =>
        e.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return list;
  }, [enrollmentRecords, filters.student]);

  const male = genderAgg?.male?.value ?? 0;
  const female = genderAgg?.female?.value ?? 0;
  const hasMoreStudents = Boolean(studentPage?.hasMore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={Users}      label="Total Students" value={metrics?.total ?? 0}           color="primary" />
        <ReportSummaryCard icon={UserCheck}  label="Active"         value={metrics?.active ?? 0}          color="green"   />
        <ReportSummaryCard icon={UserX}      label="Inactive"       value={metrics?.inactive ?? 0}        color="red"     />
        <ReportSummaryCard icon={TrendingUp} label="Gender Split"   value={`${male}M / ${female}F`}       color="blue"    />
      </div>

      <div className="flex border-b border-border gap-0">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              sub === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ReportExportBar 
        title={sub} 
        data={sub === "Student List" ? students : enrollments}
        headers={sub === "Student List" 
          ? ["Name", "Gender", "Class", "Session", "City", "Age", "Registered", "Status"]
          : ["Student", "Session", "Class", "Enrolled", "Status"]
        }
      />

      {sub === "Student List" && (
        students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description="Try adjusting filters." compact />
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Name", "Gender", "Class", "Session", "City", "Age", "Registered", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{s.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground capitalize">{s.gender}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.class}</td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{s.session}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.city}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.age}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.registered}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[s.status] ?? "bg-muted text-muted-foreground"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(listPage > 1 || hasMoreStudents) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Page {listPage} · {studentPage?.total ?? 0} total</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={listPage <= 1}
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!hasMoreStudents}
                    onClick={() => setListPage((p) => p + 1)}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {sub === "Enrollment History" && (
        enrollments.length === 0 ? (
          <EmptyState icon={Users} title="No enrollment records found" compact />
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-sm mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  {["Student", "Session", "Class", "Enrolled", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{e.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{e.session}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{e.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{e.enrolled}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[e.status] ?? "bg-muted text-muted-foreground"}`}>
                        {e.status}
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
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dashboard Main Widget</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Preview of widget rendering on the main landing dashboard</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnrollmentChart />
        </div>
      </div>
    </div>
  );
}
