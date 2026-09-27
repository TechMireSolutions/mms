import React from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import {
  sanitizeEmailForMailto,
  sanitizePhoneForSms,
  sanitizePhoneForTel,
  sanitizePhoneForWhatsApp,
} from "@mms/shared";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MESSAGING_ICON_BTN_TONES } from "@/components/ui/messagingActionStyles";
import { MessagingActionButton } from "@/components/ui/MessagingActionButton";
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
export const EntityMessagingIconActions = (function EntityMessagingIconActions({
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

  const telHref = primaryPhone ? sanitizePhoneForTel(primaryPhone) : null;
  const waHref = primaryPhone ? sanitizePhoneForWhatsApp(primaryPhone) : null;
  const smsHref = primaryPhone ? sanitizePhoneForSms(primaryPhone) : null;
  const mailHref = primaryEmail ? sanitizeEmailForMailto(primaryEmail) : null;

  const showCall = Boolean(showCallProp && (telHref || primaryPhone));
  const showWhatsApp = Boolean(messagingEnabled && (onWhatsApp || waHref) && primaryPhone);
  const showSms = Boolean(messagingEnabled && (onSms || smsHref) && primaryPhone);
  const showEmail = Boolean(messagingEnabled && (onEmail || mailHref) && primaryEmail);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  const callLabel = callAriaLabel ?? labels.call ?? "Call";
  const whatsappLabel = whatsappAriaLabel ?? labels.whatsapp ?? "WhatsApp";
  const smsLabel = smsAriaLabel ?? labels.sms ?? "SMS";
  const emailLabel = emailAriaLabel ?? labels.email ?? "Email";

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {showCall ? (
          <MessagingActionButton
            icon={Phone}
            label={callLabel}
            ariaLabel={callLabel ? `${callLabel} ${primaryPhone}` : primaryPhone || undefined}
            toneClass={MESSAGING_ICON_BTN_TONES.call}
            href={telHref || `tel:${primaryPhone}`}
          />
        ) : null}

        {showWhatsApp ? (
          <MessagingActionButton
            icon={MessageCircle}
            label={whatsappLabel}
            ariaLabel={whatsappLabel || undefined}
            toneClass={MESSAGING_ICON_BTN_TONES.whatsapp}
            onClick={onWhatsApp}
            href={onWhatsApp ? undefined : waHref}
            targetBlank={!onWhatsApp}
          />
        ) : null}

        {showSms ? (
          <MessagingActionButton
            icon={MessageSquare}
            label={smsLabel}
            ariaLabel={smsLabel || undefined}
            toneClass={MESSAGING_ICON_BTN_TONES.sms}
            onClick={onSms}
            href={onSms ? undefined : smsHref}
          />
        ) : null}

        {showEmail ? (
          <MessagingActionButton
            icon={Mail}
            label={emailLabel}
            ariaLabel={emailLabel || undefined}
            toneClass={MESSAGING_ICON_BTN_TONES.email}
            onClick={onEmail}
            href={onEmail ? undefined : mailHref}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
});

