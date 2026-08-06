import type { ReactElement } from "react";
import {
  BulkSelectionBar,
} from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionDeleteAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  BulkSelectionStatusAction,
} from "@/components/ui/BulkSelectionActions";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

type MessageChannel = "whatsapp" | "sms" | "email";

interface StudentListSelectionBarProps {
  selectedIds: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  canExport?: boolean;
  studentStatusOptions: readonly string[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  onMessage: (channel: MessageChannel) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onBulkExport?: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

export function StudentListSelectionBar({
  selectedIds,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  canExport = false,
  studentStatusOptions,
  statusBadgeConfig,
  onMessage,
  onBulkStatusChange,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: StudentListSelectionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <BulkSelectionBar
      placement="floating"
      selectedCount={selectedIds.length}
      countLabel={t("students.selectedCount", { count: selectedIds.length })}
    >
      {showDeleted ? (
        canDelete && (
          <BulkSelectionRestoreAction
            label={t("students.bulkRestore")}
            onClick={onRequestBulkRestore}
          />
        )
      ) : (
        <>
          {canWriteMessaging && (
            <BulkSelectionMessagingActions
              onChannel={onMessage}
              labels={{
                whatsapp: t("students.list.actionWhatsApp"),
                sms: t("students.list.actionSms"),
                email: t("students.list.actionEmail"),
              }}
            />
          )}

          {canExport && onBulkExport && (
            <BulkSelectionExportAction
              label={t("students.bulkExport")}
              onClick={onBulkExport}
            />
          )}

          {canWrite && onBulkStatusChange && (
            <BulkSelectionStatusAction
              label={t("students.columns.status")}
              statuses={studentStatusOptions}
              statusBadgeConfig={statusBadgeConfig}
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
                label={t("students.list.remove")}
                onClick={onRequestBulkDelete}
              />
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
