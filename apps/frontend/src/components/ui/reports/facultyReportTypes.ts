import { formatDate, type Teacher } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

export type TeacherReportSubTab = "roster" | "workload";

export interface ReportTeacher {
  id: string;
  name: string;
  employeeId: string;
  specialization: string;
  status: string;
  qualification: string;
  joinDate: string;
  gender: string;
}

export interface FacultyWorkloadItem {
  faculty: string;
  classes: number;
  sessions: number;
  totalStudents: number;
}

export interface TeacherReportFilters {
  status: string;
  class: string;
  student: string;
  session?: string;
}

export interface TeacherReportProps {
  filters: TeacherReportFilters;
  onEditVisual?: (config: unknown) => void;
}

export interface TeacherReportTablesProps {
  activeSubTab: TeacherReportSubTab;
  teachers: ReportTeacher[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  listLoading?: boolean;
  workloadRows: FacultyWorkloadItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

/** Maps a hydrated Teacher to the roster report row shape. */
export function mapTeacherRow(teacher: Teacher): ReportTeacher {
  return {
    id: String(teacher.id),
    name: teacher.name || "",
    employeeId: teacher.employeeId || "—",
    specialization: teacher.specialization || "—",
    status: teacher.status || "inactive",
    qualification: teacher.qualification || "—",
    joinDate: teacher.joinDate ? formatDate(teacher.joinDate, true) : "—",
    gender: teacher.gender || "—",
  };
}
