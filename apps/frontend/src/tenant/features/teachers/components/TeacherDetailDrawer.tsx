import { AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import type { Teacher } from "@mms/shared";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import TeacherDetail from "@/tenant/features/teachers/components/TeacherDetail";

interface TeacherDetailDrawerProps {
  teacher: Teacher | null;
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
  onRestore?: (teacherId: string) => void | Promise<void>;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export function TeacherDetailDrawer({
  teacher,
  canWrite,
  canDelete,
  onClose,
  onEdit,
  onRestore,
  openComposer,
  canWriteMessaging,
}: TeacherDetailDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {teacher && (
        <TeacherDetail
          teacher={teacher}
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
