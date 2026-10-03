/**
 * @file TasksBulkActionBar.tsx
 * @description Bulk archive/restore chrome for Tasks Work selection.
 */

import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import { useTranslation } from '@/hooks/useTranslation';

export interface TasksBulkActionBarProps {
  selectedCount: number;
  viewingDeleted: boolean;
  canDelete: boolean;
  onClearSelection: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
}

export function TasksBulkActionBar({
  selectedCount,
  viewingDeleted,
  canDelete,
  onClearSelection,
  onRequestBulkDelete,
  onRequestBulkRestore,
}: TasksBulkActionBarProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={viewingDeleted}
      countLabel={t('tasks.selectedCount', { count: selectedCount })}
      leading={<span className="text-sm font-medium">{t('nav.tasks')}</span>}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('tasks.restore')}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      deleteAction={
        !viewingDeleted && canDelete
          ? { label: t('common.delete'), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
