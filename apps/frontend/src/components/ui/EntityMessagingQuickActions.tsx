import React from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { QuickActionButton } from "@/components/ui/QuickActionButton";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import {
  MESSAGING_QUICK_ACTION_BASE,
  MESSAGING_QUICK_ACTION_TONES,
} from "@/components/ui/messagingActionStyles";
import { formatTelHref } from "@/lib/contacts/contactPhoneDisplay";
import { cn } from "@/lib/utils";

export interface EntityMessagingQuickActionLabels {
  call: string;
  whatsapp: string;
  sms: string;
  email: string;
}

export interface EntityMessagingQuickActionsProps {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  labels: EntityMessagingQuickActionLabels;
  callAriaLabel?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  /** When false, hide WhatsApp / SMS / Email (Call still shown if phone present). Default true. */
  messagingEnabled?: boolean;
  className?: string;
}

const ACTION_BASE = cn(WORK_SURFACE_INNER, MESSAGING_QUICK_ACTION_BASE, "shadow-none");

/**
 * Presentational Call / WhatsApp / SMS / Email grid for person-directory detail drawers.
 */
export const EntityMessagingQuickActions = (function EntityMessagingQuickActions({
  primaryPhone,
  primaryEmail,
  labels,
  callAriaLabel,
  onWhatsApp,
  onSms,
  onEmail,
  messagingEnabled = true,
  className,
}: EntityMessagingQuickActionsProps): React.JSX.Element | null {
  const showCall = Boolean(primaryPhone);
  const showWhatsApp = Boolean(messagingEnabled && onWhatsApp && primaryPhone);
  const showSms = Boolean(messagingEnabled && onSms && primaryPhone);
  const showEmail = Boolean(messagingEnabled && onEmail && primaryEmail);
  if (!showCall && !showWhatsApp && !showSms && !showEmail) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {showCall && primaryPhone ? (
        <QuickActionButton
          label={labels.call}
          icon={Phone}
          href={formatTelHref(primaryPhone)}
          ariaLabel={callAriaLabel ?? `${labels.call} ${primaryPhone}`}
          className={cn(ACTION_BASE, MESSAGING_QUICK_ACTION_TONES.call)}
        />
      ) : null}
      {showWhatsApp && onWhatsApp ? (
        <QuickActionButton
          label={labels.whatsapp}
          icon={MessageCircle}
          onClick={onWhatsApp}
          className={cn(ACTION_BASE, MESSAGING_QUICK_ACTION_TONES.whatsapp)}
        />
      ) : null}
      {showSms && onSms ? (
        <QuickActionButton
          label={labels.sms}
          icon={MessageSquare}
          onClick={onSms}
          className={cn(ACTION_BASE, MESSAGING_QUICK_ACTION_TONES.sms)}
        />
      ) : null}
      {showEmail && onEmail ? (
        <QuickActionButton
          label={labels.email}
          icon={Mail}
          onClick={onEmail}
          className={cn(ACTION_BASE, MESSAGING_QUICK_ACTION_TONES.email)}
        />
      ) : null}
    </div>
  );
});

