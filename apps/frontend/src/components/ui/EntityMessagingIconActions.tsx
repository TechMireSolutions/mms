import React from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import {
  sanitizeEmailForMailto,
  sanitizePhoneForSms,
  sanitizePhoneForTel,
  sanitizePhoneForWhatsApp,
} from "@mms/shared";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
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
        {showCall && (telHref || primaryPhone) ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={telHref || `tel:${primaryPhone}`}
                className={cn(
                  MESSAGING_ICON_BTN,
                  MESSAGING_ICON_BTN_TONES.call,
                  "inline-flex items-center justify-center select-none",
                )}
                aria-label={callLabel ? `${callLabel} ${primaryPhone}` : primaryPhone || undefined}
                onClick={(e) => e.stopPropagation()}
              >
                <Phone aria-hidden="true" className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs">
              {callLabel}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {showWhatsApp ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {onWhatsApp ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsApp();
                  }}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.whatsapp,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={whatsappLabel || undefined}
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.whatsapp,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={whatsappLabel || undefined}
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : null}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs">
              {whatsappLabel}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {showSms ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {onSms ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSms();
                  }}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.sms,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={smsLabel || undefined}
                >
                  <MessageSquare aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : smsHref ? (
                <a
                  href={smsHref}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.sms,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={smsLabel || undefined}
                >
                  <MessageSquare aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : null}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs">
              {smsLabel}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {showEmail ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {onEmail ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmail();
                  }}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.email,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={emailLabel || undefined}
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : mailHref ? (
                <a
                  href={mailHref}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    MESSAGING_ICON_BTN,
                    MESSAGING_ICON_BTN_TONES.email,
                    "inline-flex items-center justify-center select-none",
                  )}
                  aria-label={emailLabel || undefined}
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : null}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs">
              {emailLabel}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
});

