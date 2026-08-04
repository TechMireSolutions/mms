import { ChevronDown, Download, Tag } from "lucide-react";
import type { ReactElement } from "react";
import {
  BulkSelectionBar,
  bulkSelectionActionClassName,
} from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionDeleteAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
} from "@/components/ui/BulkSelectionActions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
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
            <Button
              type="button"
              variant="outline"
              onClick={onBulkExport}
              className={bulkSelectionActionClassName}
            >
              <Download className="w-3.5 h-3.5 text-primary" /> {t("students.bulkExport")}
            </Button>
          )}

          {canWrite && onBulkStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={bulkSelectionActionClassName}
                >
                  <Tag className="w-3.5 h-3.5 text-primary" /> {t("students.columns.status")} <ChevronDown className="w-3 h-3 ms-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {studentStatusOptions.map((statusVal) => (
                  <DropdownMenuItem
                    key={statusVal}
                    onClick={() => {
                      onBulkStatusChange(selectedIds, statusVal);
                      onClearSelection();
                    }}
                  >
                    <StatusBadge status={statusVal} size="sm" config={statusBadgeConfig} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
