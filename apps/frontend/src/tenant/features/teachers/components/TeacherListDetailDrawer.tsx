import type { ReactElement } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Teacher } from '@/lib/data/teachersData';
import TeacherDetail from '@/tenant/features/teachers/components/TeacherDetail';

interface TeacherListDetailDrawerProps {
  teacher: Teacher | null;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
  onRestore?: (teacherId: string) => void | Promise<void>;
}

export function TeacherListDetailDrawer({
  teacher,
  canWrite,
  canDelete,
  showDeleted,
  onClose,
  onEdit,
  onRestore,
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
        />
      )}
    </AnimatePresence>
  );
}
