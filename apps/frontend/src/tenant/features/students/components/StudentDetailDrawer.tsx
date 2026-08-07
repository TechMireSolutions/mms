import { AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import type { Student } from "@mms/shared";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import StudentDetail from "@/tenant/features/students/components/StudentDetail";

interface StudentDetailDrawerProps {
  student: Student | null;
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onRestore?: (studentId: string) => void | Promise<void>;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export function StudentDetailDrawer({
  student,
  canWrite,
  canDelete,
  onClose,
  onEdit,
  onRestore,
  openComposer,
  canWriteMessaging,
}: StudentDetailDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {student && (
        <StudentDetail
          student={student}
          onClose={onClose}
          onEdit={canWrite ? onEdit : undefined}
          canDelete={canDelete}
          onRestore={onRestore}
          openComposer={openComposer}
          canWriteMessaging={canWriteMessaging}
        />
      )}
    </AnimatePresence>
  );
}
