import { useState } from "react";
import { GraduationCap, BookOpen, IdCard } from "lucide-react";
import { STUDENTS_MODULE_MANIFEST, type Student, type StudentsBulkEnrollBody } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { Button } from "@/components/ui/button";
import {
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentsBulkEnrollModal } from "@/tenant/features/students/components/StudentsBulkEnrollModal";
import type { StudentsSelectionTargets } from "@/tenant/features/students/hooks/studentsSelectionTargets";

export interface StudentsBulkActionBarProps {
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
  onBulkEnroll?: (payload: { sessionIds: string[]; mode: StudentsBulkEnrollBody["mode"] }) => Promise<void> | void;
  isBulkEnrollPending?: boolean;
  onBulkPrintIdCards?: () => void;
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
  onBulkEnroll,
  isBulkEnrollPending = false,
  onBulkPrintIdCards,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  statusPending = false,
}: StudentsBulkActionBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

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
    <>
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
          !viewingDeleted && (onBulkStatusChange || onBulkEnroll || onBulkPrintIdCards) ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {bulkActions.includes("status") && canWrite && onBulkStatusChange && (
                <BulkSelectionStatusAction
                  label={t("students.columns.status")}
                  statuses={studentStatusOptions}
                  statusBadgeConfig={statusBadgeConfig}
                  disabled={statusPending}
                  onSelectStatus={(statusVal) => {
                    onBulkStatusChange(statusVal);
                  }}
                />
              )}
              {canWrite && onBulkEnroll && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollModalOpen(true)}
                  disabled={isBulkEnrollPending}
                  className="min-h-11 gap-1.5 px-3 font-medium text-xs border-border/60 hover:bg-muted/80"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden />
                  <span>{t("students.bulkEnroll")}</span>
                </Button>
              )}
              {onBulkPrintIdCards && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBulkPrintIdCards}
                  className="min-h-11 gap-1.5 px-3 font-medium text-xs border-border/60 hover:bg-muted/80"
                >
                  <IdCard className="w-3.5 h-3.5" aria-hidden />
                  <span>{t("students.bulkPrintIdCards")}</span>
                </Button>
              )}
            </div>
          ) : undefined
        }
        deleteAction={
          bulkActions.includes("delete") && canDelete
            ? { label: t("students.bulkDelete"), onClick: onRequestBulkDelete }
            : undefined
        }
      />

      {enrollModalOpen && onBulkEnroll && (
        <StudentsBulkEnrollModal
          open={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          selectedCount={selectedCount}
          onConfirm={onBulkEnroll}
          isPending={isBulkEnrollPending}
        />
      )}
    </>
  );
}

