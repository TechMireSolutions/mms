import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from "@/lib/data/teachersData";
import { TeacherListRowActions } from "@/tenant/features/teachers/components/TeacherListRowActions";

const MotionButton = motion.create(Button);

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
  const reducedMotion = useReducedMotion();
  const scaleHover = reducedMotion ? 1 : 1.02;
  const scaleTap = reducedMotion ? 1 : 0.98;

  const phone = teacher.phone?.trim() || null;
  const email = teacher.email?.trim() || null;
  const messagingEnabled = !showDeleted && Boolean(onWhatsApp || onSms || onEmail);
  const hasFaceChannels = messagingEnabled && (Boolean(phone) || Boolean(email));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      {messagingEnabled ? (
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
      ) : (
        <span />
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <MotionButton
          type="button"
          variant="outline"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onView(teacher)}
          className="flex items-center min-h-11 h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
          aria-label={`${t("teachers.list.viewDetails")} - ${displayName}`}
        >
          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t("teachers.list.viewDetails")}</span>
        </MotionButton>
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
