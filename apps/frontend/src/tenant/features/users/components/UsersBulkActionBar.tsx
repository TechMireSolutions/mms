import type { ReactElement } from 'react';
import { UserCog } from 'lucide-react';
import { USERS_MODULE_MANIFEST, type SystemUser } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import type { BulkSelectionMessageChannel } from '@/components/ui/BulkSelectionActions';
import { useTranslation } from '@/hooks/useTranslation';

export interface UsersBulkActionBarProps {
  selectedIds: string[];
  selectedUsers: SystemUser[];
  showDeleted: boolean;
  canDelete: boolean;
  onMessage?: (channel: BulkSelectionMessageChannel, users: SystemUser[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Users Work bulk bar — Teachers-shaped composition over shared ModuleWorkBulkActionBar. */
export function UsersBulkActionBar({
  selectedIds,
  selectedUsers,
  showDeleted,
  canDelete,
  onMessage,
  onBulkDelete,
  onBulkRestore,
  onClearSelection,
  bulkActions = USERS_MODULE_MANIFEST.work.bulkActions,
}: UsersBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  const showWhatsApp = bulkActions.includes('whatsapp') && Boolean(onMessage);
  const showSms = bulkActions.includes('sms') && Boolean(onMessage);
  const showEmail = bulkActions.includes('email') && Boolean(onMessage);
  const showMessaging = !showDeleted && (showWhatsApp || showSms || showEmail);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    onMessage?.(channel, selectedUsers);
  };

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedIds.length}
      viewingDeleted={showDeleted}
      countLabel={t('users.selectedCount', { count: selectedIds.length })}
      leading={<UserCog className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('users.trash.bulkRestore')}
      onRequestBulkRestore={() => {
        onBulkRestore(selectedIds);
        onClearSelection();
      }}
      onClearSelection={onClearSelection}
      messaging={
        showMessaging
          ? {
              onChannel: handleChannel,
              labels: {
                whatsapp: t('messaging.channel.whatsapp'),
                sms: t('users.sendSms'),
                email: t('users.sendEmail'),
              },
              channels: {
                whatsapp: showWhatsApp,
                sms: showSms,
                email: showEmail,
              },
            }
          : undefined
      }
      deleteAction={
        bulkActions.includes('delete') && canDelete
          ? {
              label: t('users.trash.bulkDelete'),
              onClick: () => {
                onBulkDelete(selectedIds);
                onClearSelection();
              },
            }
          : undefined
      }
    />
  );
}
