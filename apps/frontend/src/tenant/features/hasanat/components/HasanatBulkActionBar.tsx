import type { ReactElement } from 'react';
import { HandCoins } from 'lucide-react';
import { HASANAT_MODULE_MANIFEST } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import { useTranslation } from '@/hooks/useTranslation';

export interface HasanatBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Hasanat Work bulk bar — Question Bank-shaped composition over shared ModuleWorkBulkActionBar. */
export function HasanatBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = HASANAT_MODULE_MANIFEST.work.bulkActions,
}: HasanatBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t('hasanat.trash.selected', { count: selectedCount })}
      leading={<HandCoins className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('hasanat.trash.restore')}
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
