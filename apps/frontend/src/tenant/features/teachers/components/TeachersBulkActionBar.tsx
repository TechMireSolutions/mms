import type { ReactElement } from 'react';
import { Users } from 'lucide-react';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { ModuleWorkBulkActionBar } from '@/components/ui/ModuleWorkBulkActionBar';
import {
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from '@/components/ui/BulkSelectionActions';
import { type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Teacher } from '@mms/shared';
import type { TeachersSelectionTargets } from '@/tenant/features/teachers/hooks/teachersSelectionTargets';

export interface TeachersBulkActionBarProps {
  selectedIds: string[];
  selectionTargets: TeachersSelectionTargets;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (status: string) => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  canExport?: boolean;
  onBulkExport?: () => void;
  bulkActions?: readonly string[];
  /** Disables the bulk status action while the status mutation is pending. */
  statusPending?: boolean;
}

/** Teachers Work bulk bar — Students-shaped composition over shared ModuleWorkBulkActionBar. */
export function TeachersBulkActionBar({
  selectedIds,
  selectionTargets,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusConfig,
  onSms,
  onWhatsApp,
  onEmail,
  onBulkStatusChange,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  canExport = false,
  onBulkExport,
  bulkActions = TEACHERS_MODULE_MANIFEST.work.bulkActions,
  statusPending = false,
}: TeachersBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  const showWhatsApp = bulkActions.includes('whatsapp') && canWriteMessaging && Boolean(onWhatsApp);
  const showSms = bulkActions.includes('sms') && canWriteMessaging && Boolean(onSms);
  const showEmail = bulkActions.includes('email') && canWriteMessaging && Boolean(onEmail);
  const showMessaging = !showDeleted && (showWhatsApp || showSms || showEmail);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === 'whatsapp') onWhatsApp?.(selectionTargets.waTargets);
    else if (channel === 'sms') onSms?.(selectionTargets.smsReady);
    else onEmail?.(selectionTargets.emailReady);
  };

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedIds.length}
      viewingDeleted={showDeleted}
      countLabel={t('teachers.selectedCount', { count: selectedIds.length })}
      leading={<Users className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t('common.deselect')}
      canDelete={canDelete}
      restoreLabel={t('teachers.bulkRestore')}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      messaging={
        showMessaging
          ? {
              onChannel: handleChannel,
              labels: {
                whatsapp: t('teachers.whatsappBulk', {
                  count: selectionTargets.waTargets.length,
                }),
                sms: t('teachers.smsBulk', { count: selectionTargets.smsReady.length }),
                email: t('teachers.emailBulk', { count: selectionTargets.emailReady.length }),
              },
              channels: {
                whatsapp: showWhatsApp,
                sms: showSms,
                email: showEmail,
              },
            }
          : undefined
      }
      exportAction={
        bulkActions.includes('export') && canExport && onBulkExport
          ? { label: t('teachers.bulkExport'), onClick: onBulkExport }
          : undefined
      }
      extraActions={
        bulkActions.includes('status') && canWrite && onBulkStatusChange ? (
          <BulkSelectionStatusAction
            label={t('teachers.bulkStatus')}
            statuses={Object.keys(statusConfig)}
            statusBadgeConfig={statusConfig}
            disabled={statusPending}
            onSelectStatus={(statusVal) => {
              onBulkStatusChange(statusVal);
            }}
          />
        ) : undefined
      }
      deleteAction={
        bulkActions.includes('delete') && canDelete
          ? { label: t('teachers.bulkDelete'), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
