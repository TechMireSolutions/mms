import { useTranslation } from "@/hooks/useTranslation";
import { ModuleRowActionsMenu } from "@/components/ui/ModuleRowActionsMenu";
import { PersonMessagingRowActionsExtras } from "@/components/ui/PersonMessagingRowActionsExtras";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { teacherMessagingLabels } from "@/lib/teachers/teacherMessagingLabels";
import { hasWhatsApp, type Teacher } from '@mms/shared';

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

/**
 * Teachers row/card actions — thin adapter over the shared
 * {@link ModuleRowActionsMenu}; messaging items are injected as module extras
 * and omitted (not disabled) when handlers are undefined or the channel is unavailable.
 */
export function TeacherListRowActions({
  teacher,
  teacherId,
  showDeleted,
  canWrite,
  canDelete,
  hideViewItem = false,
  hideMessagingItems = false,
  triggerClassName,
  onEdit,
  onRequestDelete,
  onView,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeacherListRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { phone, email } = resolveTeacherPrimaryChannels(teacher);

  return (
    <ModuleRowActionsMenu
      triggerLabel={t("teachers.table.actions")}
      viewLabel={t("teachers.list.viewDetails")}
      editLabel={t("common.edit")}
      deleteLabel={t("common.delete")}
      restoreLabel={t("teachers.restore")}
      archived={showDeleted}
      canWrite={canWrite}
      canDelete={canDelete}
      onView={onView ? () => onView(teacher) : undefined}
      onEdit={() => onEdit(teacher)}
      onDelete={() => onRequestDelete(teacherId)}
      onRestore={onRestore ? () => onRestore(teacherId) : undefined}
      hideViewItem={hideViewItem}
      triggerClassName={triggerClassName}
      contentClassName="w-40"
      iconClassName="w-3.5 h-3.5"
      extras={
        <PersonMessagingRowActionsExtras
          phone={phone}
          email={email}
          hasWhatsApp={hasWhatsApp({ phone: phone ?? undefined })}
          hideMessagingItems={hideMessagingItems || showDeleted}
          onWhatsApp={() => onWhatsApp?.([teacher])}
          onSms={() => onSms?.([teacher])}
          onEmail={() => onEmail?.([teacher])}
          labels={teacherMessagingLabels(t)}
        />
      }
    />
  );
}
