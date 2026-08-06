import type { ReactElement } from "react";
import { GraduationCap, Trash2 } from "lucide-react";
import { STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentsSelectionTargets } from "@/tenant/features/students/hooks/studentsSelectionTargets";

export interface StudentsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  canExport?: boolean;
  bulkActions?: readonly string[];
  selectedTargets: StudentsSelectionTargets;
  studentStatusOptions: readonly string[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  onWhatsApp: (targets: Student[]) => void;
  onSms: (targets: Student[]) => void;
  onEmail: (targets: Student[]) => void;
  onBulkStatusChange?: (status: string) => void;
  onBulkExport?: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

/** Students Work bulk bar — Contacts-shaped composition over shared BulkSelectionActions. */
export function StudentsBulkActionBar({
  selectedCount,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  canExport = false,
  bulkActions = STUDENTS_MODULE_MANIFEST.work.bulkActions,
  selectedTargets,
  studentStatusOptions,
  statusBadgeConfig,
  onWhatsApp,
  onSms,
  onEmail,
  onBulkStatusChange,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: StudentsBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  const showWhatsApp = bulkActions.includes("whatsapp") && canWriteMessaging;
  const showSms = bulkActions.includes("sms") && canWriteMessaging;
  const showEmail = bulkActions.includes("email") && canWriteMessaging;
  const showMessaging = !showDeleted && (showWhatsApp || showSms || showEmail);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === "whatsapp") onWhatsApp(selectedTargets.waTargets);
    else if (channel === "sms") onSms(selectedTargets.smsReady);
    else if (channel === "email") onEmail(selectedTargets.emailReady);
  };

  return (
    <BulkSelectionBar
      placement="inline"
      tone="glass"
      selectedCount={selectedCount}
      countLabel={t("students.selectedCount", { count: selectedCount })}
      leading={<GraduationCap className="w-4 h-4 text-primary" aria-hidden />}
      trailing={
        <BulkSelectionClearAction
          label={t("common.deselect")}
          onClick={onClearSelection}
        />
      }
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
          {showMessaging && (
            <BulkSelectionMessagingActions
              onChannel={handleChannel}
              labels={{
                whatsapp: t("students.whatsappBulk", {
                  count: selectedTargets.waTargets.length,
                }),
                sms: t("students.smsBulk", { count: selectedTargets.smsReady.length }),
                email: t("students.emailBulk", {
                  count: selectedTargets.emailReady.length,
                }),
              }}
              channels={{
                whatsapp: showWhatsApp,
                sms: showSms,
                email: showEmail,
              }}
            />
          )}

          {bulkActions.includes("export") && canExport && onBulkExport && (
            <BulkSelectionExportAction
              label={t("students.bulkExport")}
              onClick={onBulkExport}
            />
          )}

          {bulkActions.includes("status") && canWrite && onBulkStatusChange && (
            <BulkSelectionStatusAction
              label={t("students.columns.status")}
              statuses={studentStatusOptions}
              statusBadgeConfig={statusBadgeConfig}
              onSelectStatus={(statusVal) => {
                onBulkStatusChange(statusVal);
              }}
            />
          )}

          {bulkActions.includes("delete") && canDelete && (
            <>
              <div className="h-4 w-px bg-border" />
              <BulkSelectionDeleteAction
                label={t("students.list.remove")}
                onClick={onRequestBulkDelete}
                icon={Trash2}
              />
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
