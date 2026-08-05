import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import { formatTelHref } from "@/lib/contacts/contactPhoneDisplay";

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
                className="rounded-lg border border-border hover:bg-success/10 hover:border-success/30 text-success transition-colors"
                title={t("students.list.actionWhatsApp")}
                aria-label={t("students.list.actionWhatsApp")}
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            )}
            {onSms && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSms}
                className="rounded-lg border border-border hover:bg-info/10 hover:border-info/30 text-info transition-colors"
                title={t("students.list.actionSms")}
                aria-label={t("students.list.actionSms")}
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            )}
            <a
              href={formatTelHref(phone)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("students.detail.callPhone", { phone })}
              title={t("students.detail.callPhone", { phone })}
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
