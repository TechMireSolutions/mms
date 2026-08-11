import type { ReactElement } from 'react';
import { Receipt } from 'lucide-react';
import { OBLIGATIONS_MODULE_MANIFEST } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import { useTranslation } from '@/hooks/useTranslation';

export interface ObligationsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Obligations Work bulk bar — Hasanat-shaped composition over shared ModuleWorkBulkActionBar. */
export function ObligationsBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = OBLIGATIONS_MODULE_MANIFEST.work.bulkActions,
}: ObligationsBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t('obligations.trash.selected', { count: selectedCount })}
      leading={<Receipt className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('obligations.trash.restore')}
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
