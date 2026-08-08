import type { ReactElement } from "react";
import {
  Edit2,
  Eye,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from '@mms/shared';

interface TeacherListRowActionsProps {
  teacher: Teacher;
  teacherId: string;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  /** When true, omit View (card already exposes a View control). */
  hideViewItem?: boolean;
  /** When true, omit messaging items (card face already shows channels). */
  hideMessagingItems?: boolean;
  triggerClassName?: string;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onView: (teacher: Teacher) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}

export function TeacherListRowActions({
  teacher,
  teacherId,
  showDeleted,
  canWrite,
  canDelete,
  hideViewItem = false,
  hideMessagingItems = false,
  triggerClassName = "rounded-lg",
  onEdit,
  onRequestDelete,
  onView,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeacherListRowActionsProps): ReactElement {
  const { t } = useTranslation();
  const showMessaging = !hideMessagingItems && Boolean(onWhatsApp || onSms || onEmail);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={triggerClassName}
          aria-label={t("common.actions")}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showDeleted ? (
          canDelete &&
          onRestore && (
            <DropdownMenuItem onClick={() => onRestore(teacherId)}>
              <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("teachers.restore")}
            </DropdownMenuItem>
          )
        ) : (
          <>
            {!hideViewItem && (
              <DropdownMenuItem onClick={() => onView(teacher)}>
                <Eye className="w-3.5 h-3.5 me-2" /> {t("teachers.list.viewDetails")}
              </DropdownMenuItem>
            )}
            {canWrite && (
              <DropdownMenuItem onClick={() => onEdit(teacher)}>
                <Edit2 className="w-3.5 h-3.5 me-2" /> {t("common.edit")}
              </DropdownMenuItem>
            )}
            {showMessaging && <DropdownMenuSeparator />}
            {!hideMessagingItems && onWhatsApp && (
              <DropdownMenuItem onClick={() => onWhatsApp([teacher])}>
                <MessageCircle className="w-3.5 h-3.5 me-2 text-success" />{" "}
                {t("teachers.list.actionWhatsApp")}
              </DropdownMenuItem>
            )}
            {!hideMessagingItems && onSms && (
              <DropdownMenuItem onClick={() => onSms([teacher])}>
                <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {t("teachers.list.actionSms")}
              </DropdownMenuItem>
            )}
            {!hideMessagingItems && onEmail && (
              <DropdownMenuItem onClick={() => onEmail([teacher])}>
                <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {t("teachers.list.actionEmail")}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRequestDelete(teacherId)}
                >
                  <Trash2 className="w-3.5 h-3.5 me-2" /> {t("common.delete")}
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
