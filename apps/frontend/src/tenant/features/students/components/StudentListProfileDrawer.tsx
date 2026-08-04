import { AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import type { Student } from "@mms/shared";
import StudentDetail from "@/tenant/features/students/components/StudentDetail";

interface StudentListProfileDrawerProps {
  student: Student | null;
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onRestore?: (studentId: string) => void | Promise<void>;
}

export function StudentListProfileDrawer({
  student,
  canWrite,
  canDelete,
  onClose,
  onEdit,
  onRestore,
}: StudentListProfileDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {student && (
        <StudentDetail
          student={student}
          onClose={onClose}
          onEdit={canWrite ? onEdit : undefined}
          canDelete={canDelete}
          onRestore={onRestore}
        />
      )}
    </AnimatePresence>
  );
}
