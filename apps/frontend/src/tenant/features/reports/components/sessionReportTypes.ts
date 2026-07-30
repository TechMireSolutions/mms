import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

export interface SessionReportFilters {
  session: string;
}

export interface SessionReportProps {
  filters: SessionReportFilters;
  onEditVisual?: (config: unknown) => void;
}

export interface SessionCapacityItem {
  sessionId: string;
  classId: string;
  session: string;
  class: string;
  enrolled: number;
  capacity: number;
  rate: number;
  status: string;
}

export interface EnrollmentTrendItem {
  month: string;
  students: number;
  sessionName: string | null;
}

export interface CapacityBarDatum {
  class: string;
  enrolled: number;
  available: number;
}

export interface SessionReportTableProps {
  sessionCapacityData: SessionCapacityItem[];
  sessionStatusConfig: Record<string, StatusBadgeConfigItem>;
  onToggleSessionFilter: (sessionName: string) => void;
  onToggleClassFilter: (className: string) => void;
}
