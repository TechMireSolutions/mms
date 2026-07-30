import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { Student, toMessagingRecipient } from "@mms/shared";
import { Eye, MessageCircle, MessageSquare, RotateCcw, Trash2, XCircle } from "lucide-react";

type MessageChannel = "whatsapp" | "sms" | "email";

interface EnrollmentRowActionsProps {
  enrollment: Enrollment;
  student?: Student;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

export function EnrollmentRowActions({
  enrollment,
  student,
  canWrite,
  canDelete,
  showDeleted,
  onView,
  onCancel,
  onDelete,
  onRestore,
  openComposer,
}: EnrollmentRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const studentDisplayName = enrollment.studentName?.trim() || student?.name || "";

  return (
    <div className="flex items-center justify-end gap-1">
      {showDeleted ? (
        canDelete && onRestore && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRestore(enrollment.id)}
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
            aria-label={t("enrollments.restore")}
            title={t("enrollments.restore")}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        )
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const phone = student?.phone || "";
              openComposer("whatsapp", [{ id: enrollment.id, name: studentDisplayName, phone, email: student?.email }]);
            }}
            className="rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
            title={t("enrollments.list.actionWhatsApp")}
            aria-label={t("enrollments.list.actionWhatsApp")}
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const phone = student?.phone || "";
              openComposer("sms", [{ id: enrollment.id, name: studentDisplayName, phone, email: student?.email }]);
            }}
            className="rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
            title={t("enrollments.list.actionSms")}
            aria-label={t("enrollments.list.actionSms")}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(enrollment)}
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
            aria-label={t("enrollments.actions.view", { name: studentDisplayName })}
            title={t("enrollments.actions.viewShort")}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          {canWrite && enrollment.status !== "cancelled" && enrollment.status !== "completed" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCancel(enrollment.id)}
              className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={t("enrollments.actions.cancel", { name: studentDisplayName })}
              title={t("enrollments.actions.cancelShort")}
            >
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(enrollment.id)}
              className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={t("common.delete")}
              title={t("common.delete")}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
