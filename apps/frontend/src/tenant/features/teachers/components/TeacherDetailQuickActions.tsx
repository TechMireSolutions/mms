import { useTranslation } from "@/hooks/useTranslation";
import { EntityMessagingQuickActions } from "@/components/ui/EntityMessagingQuickActions";
import { teacherMessagingLabels } from "@/lib/teachers/teacherMessagingLabels";
import { toMessagingRecipient, type Teacher } from "@mms/shared";

type MessageChannel = "whatsapp" | "sms" | "email";

interface TeacherDetailQuickActionsProps {
  teacher: Teacher;
  displayName: string;
  primaryPhone: string | null | undefined;
  primaryEmail: string | null | undefined;
  canWriteMessaging: boolean;
  onOpenComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

export function TeacherDetailQuickActions({
  teacher,
  displayName,
  primaryPhone,
  primaryEmail,
  canWriteMessaging,
  onOpenComposer,
}: TeacherDetailQuickActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const labels = teacherMessagingLabels(t);

  return (
    <EntityMessagingQuickActions
      primaryPhone={primaryPhone}
      primaryEmail={primaryEmail}
      labels={labels}
      callAriaLabel={labels.call}
      messagingEnabled={canWriteMessaging}
      onWhatsApp={
        primaryPhone && canWriteMessaging
          ? () =>
              onOpenComposer("whatsapp", [
                toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName }),
              ])
          : undefined
      }
      onSms={
        primaryPhone && canWriteMessaging
          ? () =>
              onOpenComposer("sms", [
                toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName }),
              ])
          : undefined
      }
      onEmail={
        primaryEmail && canWriteMessaging
          ? () =>
              onOpenComposer("email", [
                toMessagingRecipient({ ...teacher, email: primaryEmail, name: displayName }),
              ])
          : undefined
      }
    />
  );
}
