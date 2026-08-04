import type { ReactElement } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import {
  BulkSelectionBar,
  bulkSelectionActionClassName,
} from '@/components/ui/BulkSelectionBar';
import {
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  type BulkSelectionMessageChannel,
} from '@/components/ui/BulkSelectionActions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={bulkSelectionActionClassName}
                >
                  <Tag className="w-3.5 h-3.5 text-primary" /> {t('teachers.bulkStatus')} <ChevronDown className="w-3 h-3 ms-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {Object.keys(statusConfig).map((statusVal) => (
                  <DropdownMenuItem
                    key={statusVal}
                    onClick={() => {
                      onBulkStatusChange(selectedIds, statusVal);
                      onClearSelection();
                    }}
                  >
                    <StatusBadge status={statusVal} config={statusConfig} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canDelete && (
            <>
              <div className="h-4 w-px bg-border" />
              <Button
                type="button"
                variant="destructive"
                onClick={onRequestBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11"
              >
                {t('common.delete')}
              </Button>
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
