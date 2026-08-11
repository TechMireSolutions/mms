import type { ReactElement } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Teacher } from '@mms/shared';
import type { useMessageComposerState } from '@/hooks/useMessageComposerState';
import TeacherDetail from '@/tenant/features/teachers/components/TeacherDetail';

interface TeacherListDetailDrawerProps {
  teacher: Teacher | null;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
  onRestore?: (teacherId: string) => void | Promise<void>;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

export function TeacherListDetailDrawer({
  teacher,
  canWrite,
  canDelete,
  showDeleted,
  onClose,
  onEdit,
  onRestore,
  openComposer,
  canWriteMessaging,
}: TeacherListDetailDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {teacher && (
        <TeacherDetail
          teacher={teacher}
          onClose={onClose}
          onEdit={canWrite && !showDeleted ? onEdit : undefined}
          canDelete={canDelete}
          onRestore={
            onRestore
              ? async (teacherId) => {
                  await onRestore(teacherId);
                  onClose();
                }
              : undefined
          }
          openComposer={openComposer}
          canWriteMessaging={canWriteMessaging}
        />
      )}
    </AnimatePresence>
  );
}
