import type { JSX } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ModuleRowActionsMenu } from '@/components/ui/ModuleRowActionsMenu';
import { useTranslation } from '@/hooks/useTranslation';
import type { JournalEntry } from '@/lib/data/accountingData';

interface JournalEntryRowActionsProps {
  entry: JournalEntry;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  /** When true, omit View (card already exposes a View control). */
  hideViewItem?: boolean;
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onPost: (entry: JournalEntry) => void;
  onReverse: (entry: JournalEntry) => void;
  onTrashAction: (id: string) => void;
  triggerClassName?: string;
}

/**
 * Accounting journal entry row/card actions — thin adapter over the shared
 * {@link ModuleRowActionsMenu}; Post / Reverse are injected as module extras,
 * and Archive / Restore route to the parent's trash action (confirm dialog
 * owned by the list, not native confirm()).
 */
export function JournalEntryRowActions({
  entry,
  canWrite,
  canDelete,
  showDeleted,
  hideViewItem = false,
  onView,
  onEdit,
  onPost,
  onReverse,
  onTrashAction,
  triggerClassName,
}: JournalEntryRowActionsProps): JSX.Element {
  const { t } = useTranslation();
  const isDraft = entry.status === 'draft';
  const isPosted = entry.status === 'posted';

  return (
    <ModuleRowActionsMenu
      triggerLabel={t('accounting.table.actions')}
      viewLabel={t('accounting.table.view')}
      editLabel={t('accounting.table.edit')}
      deleteLabel={t('common.delete')}
      restoreLabel={t('accounting.trash.restore')}
      archived={showDeleted}
      canWrite={canWrite}
      canDelete={canDelete && (isDraft || showDeleted)}
      onView={() => onView(entry)}
      onEdit={() => onEdit(entry)}
      onDelete={() => onTrashAction(entry.id)}
      onRestore={showDeleted ? () => onTrashAction(entry.id) : undefined}
      hideViewItem={hideViewItem}
      triggerClassName={triggerClassName}
      extras={
        !showDeleted && canWrite && (isDraft || isPosted) ? (
          <>
            {isDraft ? (
              <DropdownMenuItem onClick={() => onPost(entry)}>
                <CheckCircle2 className="w-3.5 h-3.5 me-2 text-success" /> {t('accounting.journal.actions.post')}
              </DropdownMenuItem>
            ) : null}
            {isPosted ? (
              <DropdownMenuItem onClick={() => onReverse(entry)}>
                <RotateCcw className="w-3.5 h-3.5 me-2 text-warning" /> {t('accounting.journal.actions.reverse')}
              </DropdownMenuItem>
            ) : null}
          </>
        ) : undefined
      }
    />
  );
}
