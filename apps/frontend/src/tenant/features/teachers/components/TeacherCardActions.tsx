import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from "@/lib/data/teachersData";
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

  const phone = teacher.phone?.trim() || null;
  const email = teacher.email?.trim() || null;
  const messagingEnabled = !showDeleted && Boolean(onWhatsApp || onSms || onEmail);
  const hasFaceChannels = messagingEnabled && (Boolean(phone) || Boolean(email));

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      {messagingEnabled ? (
        <div className="me-auto">
          <EntityMessagingIconActions
            primaryPhone={phone}
            primaryEmail={email}
            showArchived={showDeleted}
            messagingEnabled={messagingEnabled}
            labels={{
              call: t("teachers.detail.call"),
              whatsapp: t("teachers.list.actionWhatsApp"),
              sms: t("teachers.list.actionSms"),
              email: t("teachers.list.actionEmail"),
            }}
            callAriaLabel={
              phone ? t("teachers.detail.callPhone", { phone }) : t("teachers.detail.call")
            }
            whatsappAriaLabel={t("teachers.list.actionWhatsApp")}
            smsAriaLabel={t("teachers.list.actionSms")}
            emailAriaLabel={t("teachers.list.actionEmail")}
            onWhatsApp={onWhatsApp && phone ? () => onWhatsApp([teacher]) : undefined}
            onSms={onSms && phone ? () => onSms([teacher]) : undefined}
            onEmail={onEmail && email ? () => onEmail([teacher]) : undefined}
          />
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-1.5">
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
            triggerClassName="min-h-11 min-w-11 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors cursor-pointer shadow-none"
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            onView={onView}
            onRestore={onRestore}
            onSms={onSms}
            onWhatsApp={onWhatsApp}
            onEmail={onEmail}
          />
        ) : null}
      </div>
    </div>
  );
}
