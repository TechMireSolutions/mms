import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { Student, toMessagingRecipient } from "@mms/shared";

export type EnrollmentMessageChannel = "whatsapp" | "sms" | "email";

export interface EnrollmentListContentProps {
  viewMode: WorkDirectoryViewMode;
  enrollments: Enrollment[];
  filteredCount: number;
  page: number;
  pageSize: number;
  students: Student[];
  isColumnVisible: (key: string) => boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  paymentConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (value: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onPageChange: (page: number) => void;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: EnrollmentMessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

export function getEnrollmentStudentDisplayName(
  enrollment: Enrollment,
  students: Student[],
): string {
  const student = students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
  return enrollment.studentName?.trim() || student?.name || "";
}

export function findEnrollmentStudent(
  enrollment: Enrollment,
  students: Student[],
): Student | undefined {
  return students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
}
