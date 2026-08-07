import { toMessagingRecipient, type Student } from "@mms/shared";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
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
    <DirectoryCardFooter
      leading={
        hasFaceChannels ? (
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
        ) : undefined
      }
      trailing={
        <>
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
            triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
            contentClassName="w-40"
            iconClassName="w-3.5 h-3.5"
            onViewStudent={onViewStudent}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            onOpenComposer={onOpenComposer}
          />
        </>
      }
    />
  );
}
