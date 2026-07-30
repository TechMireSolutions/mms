import React from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { toMessagingRecipient, type Teacher } from "@mms/shared";

function cleanTelUri(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface TeacherDetailQuickActionsProps {
  teacher: Teacher;
  displayName: string;
  primaryPhone: string | null | undefined;
  primaryEmail: string | null | undefined;
  canWriteMessaging: boolean;
  onOpenComposer: (channel: "whatsapp" | "sms" | "email", recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
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
  if (!primaryPhone && !(primaryEmail && canWriteMessaging)) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {primaryPhone && (
        <Button
          variant="ghost"
          asChild
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center shadow-none"
        >
          <a href={cleanTelUri(primaryPhone)}>
            <Phone className="w-4 h-4 mx-auto" />
            <span className="text-xs font-bold">{t("teachers.detail.call")}</span>
          </a>
        </Button>
      )}
      {primaryPhone && canWriteMessaging && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenComposer("whatsapp", [toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer shadow-none"
        >
          <MessageCircle className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("teachers.list.actionWhatsApp")}</span>
        </Button>
      )}
      {primaryPhone && canWriteMessaging && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenComposer("sms", [toMessagingRecipient({ ...teacher, phone: primaryPhone, name: displayName })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center cursor-pointer shadow-none"
        >
          <MessageSquare className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("teachers.list.actionSms")}</span>
        </Button>
      )}
      {primaryEmail && canWriteMessaging && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenComposer("email", [toMessagingRecipient({ ...teacher, email: primaryEmail, name: displayName })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all text-primary text-center cursor-pointer shadow-none"
        >
          <Mail className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("teachers.list.actionEmail")}</span>
        </Button>
      )}
    </div>
  );
}
