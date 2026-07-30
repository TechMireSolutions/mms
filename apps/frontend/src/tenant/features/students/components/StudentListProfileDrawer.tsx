import { AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import type { Student } from "@mms/shared";
import StudentDetail from "@/tenant/features/students/components/StudentDetail";

interface StudentListProfileDrawerProps {
  student: Student | null;
  canWrite: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

export function StudentListProfileDrawer({
  student,
  canWrite,
  onClose,
  onEdit,
}: StudentListProfileDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {student && (
        <StudentDetail
          student={student}
          onClose={onClose}
          onEdit={canWrite ? onEdit : undefined}
        />
      )}
    </AnimatePresence>
  );
}
