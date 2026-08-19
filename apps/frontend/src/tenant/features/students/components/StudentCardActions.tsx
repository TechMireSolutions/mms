import type { Student } from "@mms/shared";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListMessagingRecipient } from "@/tenant/features/students/components/StudentListContentTypes";

interface StudentCardActionsProps {
  student: Student;
  studentId: string;
  displayName: string;
  viewingDeleted: boolean;
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
  viewingDeleted,
  canWrite,
  canDelete,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentCardActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardFooter
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
            viewingDeleted={viewingDeleted}
            canWrite={canWrite}
            canDelete={canDelete}
            includeMessaging={Boolean(onOpenComposer) && !viewingDeleted}
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
