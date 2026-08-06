import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { formatTelHref } from "@/lib/contacts/contactPhoneDisplay";
import { cn } from "@/lib/utils";

export interface EntityMessagingIconActionLabels {
  call: string;
  whatsapp: string;
  sms: string;
  email: string;
}

export interface EntityMessagingIconActionsProps {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  labels: EntityMessagingIconActionLabels;
  callAriaLabel?: string;
  whatsappAriaLabel?: string;
  smsAriaLabel?: string;
  emailAriaLabel?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  /**
   * When false, hide WhatsApp / SMS / Email (Call still shown if phone present).
   * Default true.
   */
  messagingEnabled?: boolean;
  /** When true, hide all messaging actions (trash / archived). */
  showArchived?: boolean;
  className?: string;
}

/**
 * Dense icon-only Call / WhatsApp / SMS / Email row for directory cards and network links.
 */
export function EntityMessagingIconActions({
  primaryPhone,
  primaryEmail,
  labels,
  callAriaLabel,
  whatsappAriaLabel,
  smsAriaLabel,
  emailAriaLabel,
  onWhatsApp,
  onSms,
  onEmail,
  messagingEnabled = true,
  showArchived = false,
  className,
}: EntityMessagingIconActionsProps): React.JSX.Element | null {
  if (showArchived) return null;

  const showCall = Boolean(primaryPhone);
  const showWhatsApp = Boolean(messagingEnabled && onWhatsApp && primaryPhone);
  const showSms = Boolean(messagingEnabled && onSms && primaryPhone);
  const showEmail = Boolean(messagingEnabled && onEmail && primaryEmail);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {showCall && primaryPhone ? (
        <a
          href={formatTelHref(primaryPhone)}
          className={cn(
            MESSAGING_ICON_BTN,
            MESSAGING_ICON_BTN_TONES.call,
            "inline-flex items-center justify-center",
          )}
          title={callAriaLabel ?? labels.call}
          aria-label={callAriaLabel ?? `${labels.call} ${primaryPhone}`}
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : null}

      {showWhatsApp && onWhatsApp ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onWhatsApp}
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.whatsapp)}
          title={whatsappAriaLabel ?? labels.whatsapp}
          aria-label={whatsappAriaLabel ?? labels.whatsapp}
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}

      {showSms && onSms ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSms}
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.sms)}
          title={smsAriaLabel ?? labels.sms}
          aria-label={smsAriaLabel ?? labels.sms}
        >
          <MessageSquare aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}

      {showEmail && onEmail ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEmail}
          className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.email)}
          title={emailAriaLabel ?? labels.email}
          aria-label={emailAriaLabel ?? labels.email}
        >
          <Mail aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
