import { Edit2, Eye, Mail, MessageCircle, MessageSquare, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { toMessagingRecipient, type Student } from "@mms/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { StudentListMessagingRecipient } from "@/tenant/features/students/components/StudentListContentTypes";

interface StudentListActionsMenuProps {
  student: Student;
  studentId: string;
  viewingDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  includeMessaging?: boolean;
  /** When true, omit View (card/table already exposes a View control). */
  hideViewItem?: boolean;
  triggerClassName: string;
  contentClassName: string;
  iconClassName: string;
  onViewStudent: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, deletionReason?: string) => void;
  onRestore?: (id: string) => void;
  onOpenComposer?: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentListMessagingRecipient[],
  ) => void;
}

export function StudentListActionsMenu({
  student,
  studentId,
  viewingDeleted,
  canWrite,
  canDelete,
  includeMessaging = false,
  hideViewItem = false,
  triggerClassName,
  contentClassName,
  iconClassName,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListActionsMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("students.list.actionsAria")} className={triggerClassName}>
          <MoreHorizontal className={iconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        {!viewingDeleted && (
          <>
            {!hideViewItem && (
              <DropdownMenuItem onClick={() => onViewStudent(student)}>
                <Eye className="w-3.5 h-3.5 me-2" /> {t("students.list.viewProfile")}
              </DropdownMenuItem>
            )}
            {canWrite && (
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Edit2 className="w-3.5 h-3.5 me-2" /> {t("students.list.editStudent")}
              </DropdownMenuItem>
            )}
            {includeMessaging && onOpenComposer && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenComposer("whatsapp", [toMessagingRecipient(student)])}>
                  <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {t("students.list.actionWhatsApp")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenComposer("sms", [toMessagingRecipient(student)])}>
                  <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {t("students.list.actionSms")}
                </DropdownMenuItem>
                {student.email && (
                  <DropdownMenuItem onClick={() => onOpenComposer("email", [toMessagingRecipient(student)])}>
                    <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {t("students.list.actionEmail")}
                  </DropdownMenuItem>
                )}
              </>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(studentId)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 me-2" /> {t("students.list.remove")}
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        {viewingDeleted && canDelete && onRestore && (
          <DropdownMenuItem onClick={() => onRestore(studentId)}>
            <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("students.restore")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
