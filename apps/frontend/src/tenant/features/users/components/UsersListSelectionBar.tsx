import type { JSX } from 'react';
import { Mail, MessageCircle, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import type { SystemUser } from '@mms/shared';
import { BulkSelectionBar } from '@/components/ui/BulkSelectionBar';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

type UsersListMessageChannel = 'sms' | 'whatsapp' | 'email';

interface UsersListSelectionBarProps {
  selectedIds: string[];
  selectedUsers: SystemUser[];
  showDeleted: boolean;
  canDelete: boolean;
  onMessage?: (channel: UsersListMessageChannel, users: SystemUser[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onClearSelection: () => void;
}

export function UsersListSelectionBar({
  selectedIds,
  selectedUsers,
  showDeleted,
  canDelete,
  onMessage,
  onBulkDelete,
  onBulkRestore,
  onClearSelection,
}: UsersListSelectionBarProps): JSX.Element {
  const { t } = useTranslation();

  const handleBulkMessage = (channel: UsersListMessageChannel): void => {
    onMessage?.(channel, selectedUsers);
  };

  return (
    <BulkSelectionBar
      placement="inline"
      tone="tint"
      selectedCount={selectedIds.length}
      countLabel={t('users.selectedCount', { count: selectedIds.length })}
      trailing={
        <Button type="button" size="sm" variant="ghost" onClick={onClearSelection}>
          {t('users.bulkClear')}
        </Button>
      }
    >
      {onMessage && !showDeleted && (
        <>
          <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('email')}>
            <Mail className="h-3 w-3 me-1 text-primary" />
            {t('users.sendEmail')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('whatsapp')}>
            <MessageCircle className="h-3 w-3 me-1 text-success" />
            {t('messaging.channel.whatsapp')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleBulkMessage('sms')}>
            <MessageSquare className="h-3 w-3 me-1 text-info" />
            {t('users.sendSms')}
          </Button>
        </>
      )}
      {canDelete && (
        showDeleted ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              onBulkRestore(selectedIds);
              onClearSelection();
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t('users.trash.bulkRestore')}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onBulkDelete(selectedIds);
              onClearSelection();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t('users.trash.bulkDelete')}
          </Button>
        )
      )}
    </BulkSelectionBar>
  );
}
