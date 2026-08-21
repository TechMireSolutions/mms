import type { ReactElement } from "react";
import { Calendar } from "lucide-react";
import { SESSIONS_MODULE_MANIFEST } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { BulkSelectionStatusAction } from "@/components/ui/BulkSelectionActions";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

export interface SessionsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canWrite?: boolean;
  canDelete: boolean;
  canExport?: boolean;
  statusConfig?: Record<string, StatusBadgeConfigItem>;
  onBulkStatusChange?: (status: string) => void;
  statusPending?: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
  bulkActions?: readonly string[];
}

/** Sessions Work bulk bar — Teachers/Users-shaped composition over shared ModuleWorkBulkActionBar. */
export function SessionsBulkActionBar({
  selectedCount,
  showDeleted,
  canWrite = false,
  canDelete,
  canExport = false,
  statusConfig,
  onBulkStatusChange,
  statusPending = false,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  onBulkExport,
  bulkActions = SESSIONS_MODULE_MANIFEST.work.bulkActions,
}: SessionsBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t("sessions.selectedCount", { count: selectedCount })}
      leading={<Calendar className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t("common.deselect")}
      canDelete={canDelete}
      restoreLabel={t("sessions.restore")}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      exportAction={
        bulkActions.includes("export") && canExport && onBulkExport
          ? { label: t("common.export"), onClick: onBulkExport }
          : undefined
      }
      deleteAction={
        bulkActions.includes("delete") && canDelete
          ? { label: t("sessions.archive"), onClick: onRequestBulkDelete }
          : undefined
      }
      extraActions={
        !showDeleted && bulkActions.includes("status") && canWrite && onBulkStatusChange && statusConfig ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <BulkSelectionStatusAction
              label={t("sessions.bulkStatus")}
              statuses={Object.keys(statusConfig)}
              statusBadgeConfig={statusConfig}
              disabled={statusPending}
              onSelectStatus={(statusVal) => {
                onBulkStatusChange(statusVal);
              }}
            />
          </div>
        ) : undefined
      }
    />
  );
}
