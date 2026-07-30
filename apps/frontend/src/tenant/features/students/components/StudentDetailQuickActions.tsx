import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
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
        <Button
          variant="ghost"
          asChild
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center shadow-none"
        >
          <a href={cleanTelUri(primaryPhone)}>
            <Phone className="w-4 h-4 mx-auto" />
            <span className="text-xs font-bold">{t("students.detail.call")}</span>
          </a>
        </Button>
      )}
      {primaryPhone && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => openComposer("whatsapp", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer shadow-none"
        >
          <MessageCircle className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("students.list.actionWhatsApp")}</span>
        </Button>
      )}
      {primaryPhone && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => openComposer("sms", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-warning/10 hover:border-warning/30 transition-all text-warning text-center cursor-pointer shadow-none"
        >
          <MessageSquare className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("students.list.actionSms")}</span>
        </Button>
      )}
      {primaryEmail && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => openComposer("email", [toMessagingRecipient({ ...student, name: student.name || "", email: primaryEmail })])}
          className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all text-primary text-center cursor-pointer shadow-none"
        >
          <Mail className="w-4 h-4 mx-auto" />
          <span className="text-xs font-bold">{t("students.list.actionEmail")}</span>
        </Button>
      )}
    </div>
  );
}
