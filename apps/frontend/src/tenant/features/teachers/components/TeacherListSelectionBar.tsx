import type { ReactElement } from 'react';
import {
  BulkSelectionBar,
} from '@/components/ui/BulkSelectionBar';
import {
  BulkSelectionDeleteAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from '@/components/ui/BulkSelectionActions';
import { type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Teacher } from '@/lib/data/teachersData';

interface TeacherListSelectionBarProps {
  selectedIds: string[];
  selectedTeachers: Teacher[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

export function TeacherListSelectionBar({
  selectedIds,
  selectedTeachers,
  showDeleted,
  canWrite,
  canDelete,
  statusConfig,
  onSms,
  onWhatsApp,
  onEmail,
  onBulkStatusChange,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: TeacherListSelectionBarProps): ReactElement {
  const { t } = useTranslation();

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === 'whatsapp') onWhatsApp?.(selectedTeachers);
    else if (channel === 'sms') onSms?.(selectedTeachers);
    else onEmail?.(selectedTeachers);
  };

  return (
    <BulkSelectionBar
      placement="floating"
      selectedCount={selectedIds.length}
      countLabel={t('teachers.selectedCount', { count: selectedIds.length })}
    >
      {showDeleted ? (
        canDelete && (
          <BulkSelectionRestoreAction
            label={t('teachers.bulkRestore')}
            onClick={onRequestBulkRestore}
          />
        )
      ) : (
        <>
          {(onWhatsApp || onSms || onEmail) && (
            <BulkSelectionMessagingActions
              onChannel={handleChannel}
              labels={{
                whatsapp: t('teachers.list.actionWhatsApp'),
                sms: t('teachers.list.actionSms'),
                email: t('teachers.list.actionEmail'),
              }}
              channels={{
                whatsapp: Boolean(onWhatsApp),
                sms: Boolean(onSms),
                email: Boolean(onEmail),
              }}
            />
          )}
          {canWrite && onBulkStatusChange && (
            <BulkSelectionStatusAction
              label={t('teachers.bulkStatus')}
              statuses={Object.keys(statusConfig)}
              statusBadgeConfig={statusConfig}
              onSelectStatus={(statusVal) => {
                onBulkStatusChange(selectedIds, statusVal);
                onClearSelection();
              }}
            />
          )}
          {canDelete && (
            <>
              <div className="h-4 w-px bg-border" />
              <BulkSelectionDeleteAction
                label={t('common.delete')}
                onClick={onRequestBulkDelete}
              />
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
