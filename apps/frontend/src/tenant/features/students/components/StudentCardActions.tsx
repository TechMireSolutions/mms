import { toMessagingRecipient, type Student } from "@mms/shared";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListMessagingRecipient } from "@/tenant/features/students/components/StudentListContentTypes";

export interface StudentCardActionsProps {
  student: Student;
  studentId: string;
  displayName: string;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging: boolean;
  onViewStudent: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void;
  onRestore?: (id: string) => void;
  onOpenComposer?: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentListMessagingRecipient[],
  ) => void;
}

/** Contacts-shaped card footer: face messaging + View + overflow menu. */
export function StudentCardActions({
  student,
  studentId,
  displayName,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentCardActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  const phone = student.phone?.trim() || null;
  const email = student.email?.trim() || null;
  const messagingEnabled = canWriteMessaging && !showDeleted && Boolean(onOpenComposer);
  const hasFaceChannels = messagingEnabled && (Boolean(phone) || Boolean(email));

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      {messagingEnabled ? (
        <div className="me-auto">
          <EntityMessagingIconActions
            primaryPhone={phone}
            primaryEmail={email}
            showArchived={showDeleted}
            messagingEnabled={messagingEnabled}
            labels={{
              call: t("students.detail.call"),
              whatsapp: t("students.list.actionWhatsApp"),
              sms: t("students.list.actionSms"),
              email: t("students.list.actionEmail"),
            }}
            callAriaLabel={
              phone ? t("students.detail.callPhone", { phone }) : t("students.detail.call")
            }
            whatsappAriaLabel={t("students.list.actionWhatsApp")}
            smsAriaLabel={t("students.list.actionSms")}
            emailAriaLabel={t("students.list.actionEmail")}
            onWhatsApp={
              onOpenComposer && phone
                ? () => onOpenComposer("whatsapp", [toMessagingRecipient(student)])
                : undefined
            }
            onSms={
              onOpenComposer && phone
                ? () => onOpenComposer("sms", [toMessagingRecipient(student)])
                : undefined
            }
            onEmail={
              onOpenComposer && email
                ? () => onOpenComposer("email", [toMessagingRecipient(student)])
                : undefined
            }
          />
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-1.5">
        <DirectoryCardViewButton
          label={t("students.actionViewShort")}
          ariaLabel={`${t("students.list.viewProfile")} - ${displayName}`}
          onClick={() => onViewStudent(student)}
        />
        <StudentListActionsMenu
          student={student}
          studentId={studentId}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          includeMessaging={messagingEnabled && !hasFaceChannels}
          hideViewItem
          triggerClassName="min-h-11 min-w-11 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer shadow-none"
          contentClassName="w-40"
          iconClassName="w-3.5 h-3.5"
          onViewStudent={onViewStudent}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onOpenComposer={onOpenComposer}
        />
      </div>
    </div>
  );
}
