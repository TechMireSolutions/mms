import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from '@mms/shared';
import { TeacherListRowActions } from "@/tenant/features/teachers/components/TeacherListRowActions";

export interface TeacherCardActionsProps {
  teacher: Teacher;
  teacherId: string;
  displayName: string;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}

/** Contacts-shaped card footer: View + overflow menu. */
export function TeacherCardActions({
  teacher,
  teacherId,
  displayName,
  showDeleted,
  canWrite,
  canDelete,
  onView,
  onEdit,
  onRequestDelete,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeacherCardActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardFooter
      trailing={
        <>
          <DirectoryCardViewButton
            label={t("teachers.actionViewShort")}
            ariaLabel={`${t("teachers.list.viewDetails")} - ${displayName}`}
            onClick={() => onView(teacher)}
          />
          <TeacherListRowActions
            teacher={teacher}
            teacherId={teacherId}
            showDeleted={showDeleted}
            canWrite={canWrite}
            canDelete={canDelete}
            hideViewItem
            triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            onView={onView}
            onRestore={onRestore}
            onSms={onSms}
            onWhatsApp={onWhatsApp}
            onEmail={onEmail}
          />
        </>
      }
    />
  );
}
