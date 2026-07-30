import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { calcAge, formatDate, type Student } from "@mms/shared";

export type StudentReportSubTab = "list" | "history";

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

export interface StudentReportFilters {
  status: string;
  class: string;
  student: string;
}

export interface StudentReportProps {
  filters: StudentReportFilters;
  onEditVisual?: (config: unknown) => void;
}

export interface StudentReportTablesProps {
  activeSubTab: StudentReportSubTab;
  students: ReportStudent[];
  enrollments: EnrollmentHistoryItem[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  enrollmentStatusConfig: Record<string, StatusBadgeConfigItem>;
}

export function mapStudentRow(student: Student): ReportStudent {
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
