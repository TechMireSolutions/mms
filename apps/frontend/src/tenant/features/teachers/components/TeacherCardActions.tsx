import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherMessagingLabels } from "@/lib/teachers/teacherMessagingLabels";
import type { Teacher } from '@mms/shared';
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { TeacherListRowActions } from "@/tenant/features/teachers/components/TeacherListRowActions";

export interface TeacherCardActionsProps {
  teacher: Teacher;
  teacherId: string;
  displayName: string;
  showDeleted: boolean;
  showActionsColumn: boolean;
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

/** Contacts-shaped card footer: face messaging + View + overflow menu. */
export function TeacherCardActions({
  teacher,
  teacherId,
  displayName,
  showDeleted,
  showActionsColumn,
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
  const labels = teacherMessagingLabels(t);

  const { phone, email } = resolveTeacherPrimaryChannels(teacher);
  const messagingEnabled = !showDeleted && Boolean(onWhatsApp || onSms || onEmail);
  const hasFaceChannels =
    !showDeleted && (Boolean(phone) || (Boolean(onEmail) && Boolean(email)));

  return (
    <DirectoryCardFooter
      leading={
        hasFaceChannels ? (
          <EntityMessagingIconActions
            primaryPhone={phone}
            primaryEmail={email}
            showArchived={showDeleted}
            messagingEnabled={messagingEnabled}
            labels={labels}
            callAriaLabel={
              phone ? t("teachers.detail.callPhone", { phone }) : labels.call
            }
            whatsappAriaLabel={labels.whatsapp}
            smsAriaLabel={labels.sms}
            emailAriaLabel={labels.email}
            onWhatsApp={onWhatsApp && phone ? () => onWhatsApp([teacher]) : undefined}
            onSms={onSms && phone ? () => onSms([teacher]) : undefined}
            onEmail={onEmail && email ? () => onEmail([teacher]) : undefined}
          />
        ) : undefined
      }
      trailing={
        <>
          <DirectoryCardViewButton
            label={t("teachers.actionViewShort")}
            ariaLabel={`${t("teachers.list.viewDetails")} - ${displayName}`}
            onClick={() => onView(teacher)}
          />
          {showActionsColumn ? (
            <TeacherListRowActions
              teacher={teacher}
              teacherId={teacherId}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              hideViewItem
              hideMessagingItems={hasFaceChannels}
              triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              onView={onView}
              onRestore={onRestore}
              onSms={onSms}
              onWhatsApp={onWhatsApp}
              onEmail={onEmail}
            />
          ) : null}
        </>
      }
    />
  );
}
