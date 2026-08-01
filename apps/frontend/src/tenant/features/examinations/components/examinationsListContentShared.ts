import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { Exam } from "@/lib/data/examinationData";

export interface ExamClassOption {
  id: string;
  name: string;
}

export interface ExaminationsVisibleColumns {
  name: boolean;
  subject: boolean;
  date: boolean;
  duration: boolean;
  status: boolean;
  totalMarks: boolean;
  passingMarks: boolean;
  classes: boolean;
}

export interface ExaminationsListContentProps {
  viewMode: WorkDirectoryViewMode;
  exams: Exam[];
  selectedIds: string[];
  visibleColumns: ExaminationsVisibleColumns;
  classes: ExamClassOption[];
  enrollments: Enrollment[];
  allFilteredSelected: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canTrashRows: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEdit: (exam: Exam) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleSelected: (id: string) => void;
  onTrashAction: (id: string) => void;
}

export function getExamMeta(
  exam: Exam,
  classes: ExamClassOption[],
  enrollments: Enrollment[],
): { assignedClasses: ExamClassOption[]; studentCount: number } {
  const assignedClasses = classes.filter((sessionClass) => exam.classIds.includes(sessionClass.id));
  const classIds = new Set(exam.classIds);
  const studentCount = new Set(
    enrollments
      .filter((enrollment) =>
        classIds.has(enrollment.classId) &&
        enrollment.status !== "cancelled" &&
        enrollment.status !== "completed"
      )
      .map((enrollment) => String(enrollment.studentId)),
  ).size;
  return { assignedClasses, studentCount };
}
