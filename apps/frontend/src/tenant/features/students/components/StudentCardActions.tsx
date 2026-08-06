import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { toMessagingRecipient, type Student } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListMessagingRecipient } from "@/tenant/features/students/components/StudentListContentTypes";

const MotionButton = motion.create(Button);

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
  const reducedMotion = useReducedMotion();
  const scaleHover = reducedMotion ? 1 : 1.02;
  const scaleTap = reducedMotion ? 1 : 0.98;

  const phone = student.phone?.trim() || null;
  const email = student.email?.trim() || null;
  const messagingEnabled = canWriteMessaging && !showDeleted && Boolean(onOpenComposer);
  const hasFaceChannels =
    messagingEnabled &&
    (Boolean(phone) || Boolean(email));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      {messagingEnabled ? (
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
            phone
              ? t("students.detail.callPhone", { phone })
              : t("students.detail.call")
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
      ) : (
        <span />
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <MotionButton
          type="button"
          variant="outline"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onViewStudent(student)}
          className="flex items-center min-h-11 h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
          aria-label={`${t("students.list.viewProfile")} - ${displayName}`}
        >
          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t("students.list.viewProfile")}</span>
        </MotionButton>
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
