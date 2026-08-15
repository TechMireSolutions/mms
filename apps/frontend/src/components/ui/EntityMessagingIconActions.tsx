import React from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { formatTelHref } from "@/lib/contacts/contactPhoneDisplay";
import { cn } from "@/lib/utils";

export interface EntityMessagingIconActionLabels {
  call?: string;
  whatsapp?: string;
  sms?: string;
  email?: string;
}

export interface EntityMessagingIconActionsProps {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  /** Labels only required for actions that are actually shown. */
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
  /** When false, hide the Call tel: link even if a phone is present. Default true. */
  showCall?: boolean;
  /** When true, hide all messaging actions (trash / archived). */
  showArchived?: boolean;
  className?: string;
}

/**
 * Dense icon-only Call / WhatsApp / SMS / Email row for directory cards and network links.
 */
export const EntityMessagingIconActions = React.memo(function EntityMessagingIconActions({
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
  showCall: showCallProp = true,
  showArchived = false,
  className,
}: EntityMessagingIconActionsProps): React.JSX.Element | null {
  if (showArchived) return null;

  const showCall = Boolean(showCallProp && primaryPhone);
  const showWhatsApp = Boolean(messagingEnabled && onWhatsApp && primaryPhone);
  const showSms = Boolean(messagingEnabled && onSms && primaryPhone);
  const showEmail = Boolean(messagingEnabled && onEmail && primaryEmail);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  const callLabel = callAriaLabel ?? labels.call ?? "";
  const whatsappLabel = whatsappAriaLabel ?? labels.whatsapp ?? "";
  const smsLabel = smsAriaLabel ?? labels.sms ?? "";
  const emailLabel = emailAriaLabel ?? labels.email ?? "";

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
          title={callLabel || undefined}
          aria-label={callLabel ? `${callLabel} ${primaryPhone}` : primaryPhone}
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
          title={whatsappLabel || undefined}
          aria-label={whatsappLabel || undefined}
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
          title={smsLabel || undefined}
          aria-label={smsLabel || undefined}
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
          title={emailLabel || undefined}
          aria-label={emailLabel || undefined}
        >
          <Mail aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
});

