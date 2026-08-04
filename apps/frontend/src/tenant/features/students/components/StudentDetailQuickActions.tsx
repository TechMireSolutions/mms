import { useTranslation } from "@/hooks/useTranslation";
import { QuickActionButton } from "@/components/ui/QuickActionButton";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { cleanTelUri } from "@/tenant/features/students/components/studentDetailUtils";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { toMessagingRecipient, type Student } from "@mms/shared";

type MessageChannel = "whatsapp" | "sms" | "email";

interface StudentDetailQuickActionsProps {
  student: Student;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  openComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

const QUICK_ACTION_BASE = `${WORK_SURFACE_INNER} text-center`;

export function StudentDetailQuickActions({
  student,
  primaryPhone,
  primaryEmail,
  openComposer,
}: StudentDetailQuickActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {primaryPhone && (
        <QuickActionButton
          label={t("students.detail.call")}
          icon={Phone}
          href={cleanTelUri(primaryPhone)}
          ariaLabel={t("students.detail.callPhone", { phone: primaryPhone })}
          className={`${QUICK_ACTION_BASE} hover:bg-info/10 hover:border-info/30 text-info`}
        />
      )}
      {primaryPhone && (
        <QuickActionButton
          label={t("students.list.actionWhatsApp")}
          icon={MessageCircle}
          onClick={() => openComposer("whatsapp", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
          className={`${QUICK_ACTION_BASE} hover:bg-success/10 hover:border-success/30 text-success`}
        />
      )}
      {primaryPhone && (
        <QuickActionButton
          label={t("students.list.actionSms")}
          icon={MessageSquare}
          onClick={() => openComposer("sms", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
          className={`${QUICK_ACTION_BASE} hover:bg-warning/10 hover:border-warning/30 text-warning`}
        />
      )}
      {primaryEmail && (
        <QuickActionButton
          label={t("students.list.actionEmail")}
          icon={Mail}
          onClick={() =>
            openComposer("email", [
              toMessagingRecipient({ ...student, name: student.name || "", email: primaryEmail }),
            ])
          }
          className={`${QUICK_ACTION_BASE} hover:bg-primary/10 hover:border-primary/30 text-primary`}
        />
      )}
    </div>
  );
}
