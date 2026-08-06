import type { JSX } from 'react';
import { Eye, KeyRound, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { SystemUser } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface UsersListRowActionsProps {
  user: SystemUser;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  /** When true, omit View (card already exposes a View control). */
  hideViewItem?: boolean;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
}

export function UsersListRowActions({
  user,
  canWrite,
  canDelete,
  showDeleted,
  hideViewItem = false,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onResetPassword,
}: UsersListRowActionsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-1">
      {!hideViewItem && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onView(user)}
          aria-label={t('users.actionView', { name: user.name })}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      )}
      {canWrite && !showDeleted && (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onEdit(user)}
            aria-label={t('users.actionEdit', { name: user.name })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onResetPassword(user)}
            aria-label={t('users.actionResetPassword', { name: user.name })}
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      {canDelete && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => (showDeleted ? onRestore(user.id) : onDelete(user.id))}
          aria-label={
            showDeleted
              ? t('users.trash.restore')
              : t('users.trash.delete', { name: user.name })
          }
        >
          {showDeleted ? (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
        </Button>
      )}
    </div>
  );
}
