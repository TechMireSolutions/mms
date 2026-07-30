import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

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
