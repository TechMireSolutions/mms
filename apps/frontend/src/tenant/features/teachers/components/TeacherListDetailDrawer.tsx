import type { ReactElement } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Teacher } from '@/lib/data/teachersData';
import TeacherDetail from '@/tenant/features/teachers/components/TeacherDetail';

interface TeacherListDetailDrawerProps {
  teacher: Teacher | null;
  canWrite: boolean;
  showDeleted: boolean;
  onClose: () => void;
  onEdit: (teacher: Teacher) => void;
}

export function TeacherListDetailDrawer({
  teacher,
  canWrite,
  showDeleted,
  onClose,
  onEdit,
}: TeacherListDetailDrawerProps): ReactElement {
  return (
    <AnimatePresence>
      {teacher && (
        <TeacherDetail
          teacher={teacher}
          onClose={onClose}
          onEdit={canWrite && !showDeleted ? onEdit : undefined}
        />
      )}
    </AnimatePresence>
  );
}
