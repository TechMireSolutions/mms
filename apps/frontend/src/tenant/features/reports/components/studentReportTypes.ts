import { calcAge, formatDate, type Session, type Student } from "@mms/shared";
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
  session?: string;
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

export function resolveStudentSessionLabels(
  student: Student,
  sessions: Session[],
): { sessionLabel: string; classLabel: string } {
  const enrolledIds = student.enrolledSessions ?? [];
  const matchedSessions = sessions.filter((session) => enrolledIds.includes(session.id));
  const sessionLabel = matchedSessions.map((session) => session.name).filter(Boolean).join(", ") || "—";
  const classNames = new Set<string>();
  for (const session of matchedSessions) {
    for (const sessionClass of session.classes ?? []) {
      if (sessionClass.name) classNames.add(sessionClass.name);
    }
  }
  const classLabel = [...classNames].join(", ") || "—";
  return { sessionLabel, classLabel };
}

export function mapStudentRow(student: Student, sessions: Session[] = []): ReportStudent {
  const age = calcAge(student.dob) ?? 0;
  const { sessionLabel, classLabel } = resolveStudentSessionLabels(student, sessions);
  return {
    id: String(student.id),
    name: student.name || "",
    gender: student.gender || "",
    status: student.status || "inactive",
    session: sessionLabel,
    class: classLabel,
    city: student.city || "—",
    registered: student.registeredDate ? formatDate(student.registeredDate, true) : "—",
    age,
  };
}

export function studentMatchesSessionFilter(student: Student, sessionId: string): boolean {
  if (!sessionId || sessionId === "all") return true;
  return (student.enrolledSessions ?? []).includes(sessionId);
}

export function studentMatchesClassFilter(
  student: Student,
  className: string,
  sessions: Session[],
): boolean {
  if (!className || className === "all") return true;
  const enrolledIds = new Set(student.enrolledSessions ?? []);
  for (const session of sessions) {
    if (!enrolledIds.has(session.id)) continue;
    if ((session.classes ?? []).some((sessionClass) => sessionClass.name === className)) {
      return true;
    }
  }
  return false;
}
