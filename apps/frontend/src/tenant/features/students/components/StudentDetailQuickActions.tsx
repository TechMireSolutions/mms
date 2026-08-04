import { useTranslation } from "@/hooks/useTranslation";
import { EntityMessagingQuickActions } from "@/components/ui/EntityMessagingQuickActions";
import { toMessagingRecipient, type Student } from "@mms/shared";

type MessageChannel = "whatsapp" | "sms" | "email";

interface StudentDetailQuickActionsProps {
  student: Student;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  openComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

export function StudentDetailQuickActions({
  student,
  primaryPhone,
  primaryEmail,
  openComposer,
}: StudentDetailQuickActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <EntityMessagingQuickActions
      primaryPhone={primaryPhone}
      primaryEmail={primaryEmail}
      labels={{
        call: t("students.detail.call"),
        whatsapp: t("students.list.actionWhatsApp"),
        sms: t("students.list.actionSms"),
        email: t("students.list.actionEmail"),
      }}
      callAriaLabel={
        primaryPhone
          ? t("students.detail.callPhone", { phone: primaryPhone })
          : undefined
      }
      onWhatsApp={
        primaryPhone
          ? () => openComposer("whatsapp", [toMessagingRecipient({ ...student, phone: primaryPhone })])
          : undefined
      }
      onSms={
        primaryPhone
          ? () => openComposer("sms", [toMessagingRecipient({ ...student, phone: primaryPhone })])
          : undefined
      }
      onEmail={
        primaryEmail
          ? () =>
              openComposer("email", [
                toMessagingRecipient({ ...student, name: student.name || "", email: primaryEmail }),
              ])
          : undefined
      }
    />
  );
}
