import type { ReactElement } from "react";
import { GraduationCap } from "lucide-react";
import { STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import {
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentsSelectionTargets } from "@/tenant/features/students/hooks/studentsSelectionTargets";

interface StudentsBulkActionBarProps {
  selectedCount: number;
  viewingDeleted: boolean;
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
  /** Disables the bulk status action while the status mutation is pending. */
  statusPending?: boolean;
}

/** Students Work bulk bar — Contacts-shaped composition over shared ModuleWorkBulkActionBar. */
export function StudentsBulkActionBar({
  selectedCount,
  viewingDeleted,
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
  statusPending = false,
}: StudentsBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  const showWhatsApp = bulkActions.includes("whatsapp") && canWriteMessaging;
  const showSms = bulkActions.includes("sms") && canWriteMessaging;
  const showEmail = bulkActions.includes("email") && canWriteMessaging;
  const showMessaging = !viewingDeleted && (showWhatsApp || showSms || showEmail);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === "whatsapp") onWhatsApp(selectedTargets.waTargets);
    else if (channel === "sms") onSms(selectedTargets.smsReady);
    else if (channel === "email") onEmail(selectedTargets.emailReady);
  };

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={viewingDeleted}
      countLabel={t("students.selectedCount", { count: selectedCount })}
      leading={<GraduationCap className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t("common.deselect")}
      canDelete={canDelete}
      restoreLabel={t("students.bulkRestore")}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      messaging={
        showMessaging
          ? {
              onChannel: handleChannel,
              labels: {
                whatsapp: t("students.whatsappBulk", {
                  count: selectedTargets.waTargets.length,
                }),
                sms: t("students.smsBulk", { count: selectedTargets.smsReady.length }),
                email: t("students.emailBulk", {
                  count: selectedTargets.emailReady.length,
                }),
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
        bulkActions.includes("export") && canExport && onBulkExport
          ? { label: t("students.bulkExport"), onClick: onBulkExport }
          : undefined
      }
      extraActions={
        bulkActions.includes("status") && canWrite && onBulkStatusChange ? (
          <BulkSelectionStatusAction
            label={t("students.columns.status")}
            statuses={studentStatusOptions}
            statusBadgeConfig={statusBadgeConfig}
            disabled={statusPending}
            onSelectStatus={(statusVal) => {
              onBulkStatusChange(statusVal);
            }}
          />
        ) : undefined
      }
      deleteAction={
        bulkActions.includes("delete") && canDelete
          ? { label: t("students.bulkDelete"), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
