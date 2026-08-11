import type { ReactElement } from 'react';
import { UserCheck } from 'lucide-react';
import { ATTENDANCE_MODULE_MANIFEST } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import { useTranslation } from '@/hooks/useTranslation';

export interface AttendanceBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Attendance Work bulk bar — Obligations-shaped composition over shared ModuleWorkBulkActionBar. */
export function AttendanceBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = ATTENDANCE_MODULE_MANIFEST.work.bulkActions,
}: AttendanceBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t('attendance.trash.selected', { count: selectedCount })}
      leading={<UserCheck className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('attendance.trash.restore')}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      deleteAction={
        bulkActions.includes('delete') && canDelete
          ? { label: t('common.delete'), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
