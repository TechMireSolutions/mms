import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from '@mms/shared';
import { TeachersListRowActions } from "@/tenant/features/faculty/components/FacultyListRowActions";

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
    <DirectoryCardFooterActions
      onView={() => onView(teacher)}
      viewLabel={t("faculty.actionViewShort") || t("teachers.actionViewShort")}
      viewAriaLabel={`${t("faculty.list.viewDetails") || t("teachers.list.viewDetails")} - ${displayName}`}
      overflowActions={
        <TeachersListRowActions
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
      }
    />
  );
}

export type FacultyCardActionsProps = TeacherCardActionsProps;
export const FacultyCardActions = TeacherCardActions;

