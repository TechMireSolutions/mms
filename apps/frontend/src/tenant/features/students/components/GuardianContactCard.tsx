import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { formatTelHref } from "@/lib/contacts/contactPhoneDisplay";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";

interface GuardianContactCardProps {
  label: string;
  badgeCode: string;
  badgeBg: string;
  badgeText: string;
  name: string;
  phone?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
}

export function GuardianContactCard({
  label,
  badgeCode,
  badgeBg,
  badgeText,
  name,
  phone,
  onWhatsApp,
  onSms,
}: GuardianContactCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card accentColor="info" className="p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3 text-start ms-1">
          <div className={`w-8 h-8 rounded-lg ${badgeBg} ${badgeText} flex items-center justify-center text-xs font-bold shrink-0`}>
            {badgeCode}
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-black uppercase tracking-widest ${badgeText} mb-0.5 block`}>{label}</span>
            <h5 className="text-xs font-bold text-foreground truncate">{name}</h5>
            {phone && <p className="text-xs text-muted-foreground mt-0.5 truncate">{phone}</p>}
          </div>
        </div>
        {phone && (
          <div className="flex shrink-0 items-center gap-1 me-1">
            {onWhatsApp && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onWhatsApp}
                className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.whatsapp)}
                title={t("students.list.actionWhatsApp")}
                aria-label={t("students.list.actionWhatsApp")}
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
            {onSms && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSms}
                className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.sms)}
                title={t("students.list.actionSms")}
                aria-label={t("students.list.actionSms")}
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
            <a
              href={formatTelHref(phone)}
              className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.call, "inline-flex items-center justify-center")}
              aria-label={t("students.detail.callPhone", { phone })}
              title={t("students.detail.callPhone", { phone })}
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
