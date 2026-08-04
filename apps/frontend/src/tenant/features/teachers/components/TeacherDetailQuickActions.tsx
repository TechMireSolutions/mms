import { useTranslation } from "@/hooks/useTranslation";
import { QuickActionButton } from "@/components/ui/QuickActionButton";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { toMessagingRecipient, type Teacher } from "@mms/shared";

type MessageChannel = "whatsapp" | "sms" | "email";

function cleanTelUri(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface TeacherDetailQuickActionsProps {
  teacher: Teacher;
  displayName: string;
  primaryPhone: string | null | undefined;
  primaryEmail: string | null | undefined;
  canWriteMessaging: boolean;
  onOpenComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

const QUICK_ACTION_BASE = `${WORK_SURFACE_INNER} text-center shadow-none`;

export function TeacherDetailQuickActions({
  teacher,
  displayName,
  primaryPhone,
  primaryEmail,
  canWriteMessaging,
  onOpenComposer,
}: TeacherDetailQuickActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!primaryPhone && !(primaryEmail && canWriteMessaging)) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {primaryPhone && (
        <QuickActionButton
          label={t("teachers.detail.call")}
          icon={Phone}
          href={cleanTelUri(primaryPhone)}
          ariaLabel={t("teachers.detail.call")}
          className={`${QUICK_ACTION_BASE} hover:bg-info/10 hover:border-info/30 text-info`}
        />
      )}
      {primaryPhone && canWriteMessaging && (
        <QuickActionButton
          label={t("teachers.list.actionWhatsApp")}
          icon={MessageCircle}
          onClick={() =>
            onOpenComposer("whatsapp", [
              toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName }),
            ])
          }
          className={`${QUICK_ACTION_BASE} hover:bg-success/10 hover:border-success/30 text-success`}
        />
      )}
      {primaryPhone && canWriteMessaging && (
        <QuickActionButton
          label={t("teachers.list.actionSms")}
          icon={MessageSquare}
          onClick={() =>
            onOpenComposer("sms", [
              toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName }),
            ])
          }
          className={`${QUICK_ACTION_BASE} hover:bg-info/10 hover:border-info/30 text-info`}
        />
      )}
      {primaryEmail && canWriteMessaging && (
        <QuickActionButton
          label={t("teachers.list.actionEmail")}
          icon={Mail}
          onClick={() =>
            onOpenComposer("email", [
              toMessagingRecipient({ ...teacher, email: primaryEmail, name: displayName }),
            ])
          }
          className={`${QUICK_ACTION_BASE} hover:bg-primary/10 hover:border-primary/30 text-primary`}
        />
      )}
    </div>
  );
}
