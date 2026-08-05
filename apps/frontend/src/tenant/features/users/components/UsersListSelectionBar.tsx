import type { ReactElement } from 'react';
import { Trash2 } from 'lucide-react';
import type { SystemUser } from '@mms/shared';
import { BulkSelectionBar } from '@/components/ui/BulkSelectionBar';
import {
  BulkSelectionDeleteAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  type BulkSelectionMessageChannel,
} from '@/components/ui/BulkSelectionActions';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface UsersListSelectionBarProps {
  selectedIds: string[];
  selectedUsers: SystemUser[];
  showDeleted: boolean;
  canDelete: boolean;
  onMessage?: (channel: BulkSelectionMessageChannel, users: SystemUser[]) => void;
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
}: UsersListSelectionBarProps): ReactElement {
  const { t } = useTranslation();

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
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
        <BulkSelectionMessagingActions
          onChannel={handleChannel}
          labels={{
            whatsapp: t('messaging.channel.whatsapp'),
            sms: t('users.sendSms'),
            email: t('users.sendEmail'),
          }}
        />
      )}
      {canDelete && (
        showDeleted ? (
          <BulkSelectionRestoreAction
            label={t('users.trash.bulkRestore')}
            onClick={() => {
              onBulkRestore(selectedIds);
              onClearSelection();
            }}
          />
        ) : (
          <BulkSelectionDeleteAction
            label={t('users.trash.bulkDelete')}
            onClick={() => {
              onBulkDelete(selectedIds);
              onClearSelection();
            }}
            icon={Trash2}
          />
        )
      )}
    </BulkSelectionBar>
  );
}
