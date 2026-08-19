import React, { useState, type ReactNode } from "react";
import {
  Copy,
  Check,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  MapPin,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  sanitizeEmailForMailto,
  sanitizePhoneForSms,
  sanitizePhoneForTel,
  sanitizePhoneForWhatsApp,
  formatPhoneWithCountryCode,
  parsePhoneNumber,
} from "@mms/shared";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

export type ContactActionVariant = "stacked" | "inline" | "pill" | "actions-only" | "drawer";

interface ActionIconButtonProps {
  icon: LucideIcon;
  label: string;
  tooltipText: string;
  href?: string | null;
  target?: string;
  rel?: string;
  toneClass?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const ActionIconButton = React.memo(function ActionIconButton({
  icon: Icon,
  label,
  tooltipText,
  href,
  target,
  rel,
  toneClass,
  className,
  onClick,
}: ActionIconButtonProps): React.JSX.Element {
  const commonClasses = cn(
    MESSAGING_ICON_BTN,
    "h-7 w-7 min-h-7 min-w-7 sm:min-h-7 sm:min-w-7 rounded-lg inline-flex items-center justify-center p-0 shrink-0 select-none text-xs",
    toneClass,
    className,
  );

  const content = (
    <>
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">{label}</span>
    </>
  );

  const element = href ? (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={commonClasses}
    >
      {content}
    </a>
  ) : (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={commonClasses}
    >
      {content}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4} className="text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
});

interface ActionCopyButtonProps {
  text: string;
  copyToastMessage?: string;
  tooltipCopyText?: string;
  tooltipCopiedText?: string;
  className?: string;
}

const ActionCopyButton = React.memo(function ActionCopyButton({
  text,
  copyToastMessage,
  tooltipCopyText = "Copy",
  tooltipCopiedText = "Copied",
  className,
}: ActionCopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        if (copyToastMessage) {
          notify.success(copyToastMessage);
        }
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  const label = copied ? tooltipCopiedText : tooltipCopyText;

  return (
    <ActionIconButton
      icon={copied ? Check : Copy}
      label={label}
      tooltipText={label}
      toneClass={cn(
        MESSAGING_ICON_BTN_TONES.copy,
        copied && "border-success/30 bg-success/5 text-success hover:text-success hover:bg-success/15 hover:border-success/40",
      )}
      onClick={handleCopy}
      className={className}
    />
  );
});

export interface ContactPhoneActionProps {
  /** Raw phone number or E.164 phone string */
  phone?: string | null;
  /** Country code prefix to display or fallback (e.g. "+92") */
  countryCode?: string | null;
  /** Formatted phone display text (e.g. "300 1234567") */
  phoneDisplay?: string | null;
  /** Contact display name for aria-labels and tooltips */
  name?: string;
  /** Visual presentation variant. Default is "stacked" (value on top, action links underneath). */
  variant?: ContactActionVariant;
  /** Whether to show the Copy button. Default true. */
  showCopy?: boolean;
  /** Whether to show the Call tel: action. Default true. */
  showCall?: boolean;
  /** Whether to show the WhatsApp wa.me action. Default true. */
  showWhatsApp?: boolean;
  /** Whether to show the SMS sms: action. Default true. */
  showSms?: boolean;
  /** Custom handler for WhatsApp click. If omitted, opens https://wa.me/... */
  onWhatsApp?: () => void;
  /** Custom handler for SMS click. If omitted, opens sms:... */
  onSms?: () => void;
  /** Custom handler for Call click. If omitted, opens tel:... */
  onCall?: () => void;
  /** When true, disable/hide actions (e.g. archived / soft-deleted records). */
  disabled?: boolean;
  /** Fallback placeholder when phone is null/empty. Default is "—". */
  emptyFallback?: ReactNode;
  /** Toast message on copy */
  copyToast?: string;
  /** Custom container class */
  className?: string;
  /** Custom action buttons row class */
  actionsClassName?: string;
  /** Custom labels for action tooltips / aria */
  labels?: {
    call?: string;
    sms?: string;
    whatsapp?: string;
    copy?: string;
    copied?: string;
  };
}

export const ContactPhoneAction = React.memo(function ContactPhoneAction({
  phone,
  countryCode: countryCodeProp,
  phoneDisplay: phoneDisplayProp,
  name,
  variant = "stacked",
  showCopy = true,
  showCall = true,
  showWhatsApp = true,
  showSms = true,
  onWhatsApp,
  onSms,
  onCall,
  disabled = false,
  emptyFallback = <span className="text-sm text-muted-foreground/60">—</span>,
  copyToast,
  className,
  actionsClassName,
  labels,
}: ContactPhoneActionProps): React.JSX.Element | null {
  const rawPhone = (phone || "").trim();

  if (!rawPhone) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  const defaultCountryCode = countryCodeProp || "+92";
  const formattedPhone = formatPhoneWithCountryCode(rawPhone, defaultCountryCode) || rawPhone;
  const parsed = parsePhoneNumber(formattedPhone, defaultCountryCode);
  const countryCode = countryCodeProp || parsed.countryCode || defaultCountryCode;
  const phoneDisplay = phoneDisplayProp || parsed.number || rawPhone;

  const telHref = sanitizePhoneForTel(formattedPhone, defaultCountryCode);
  const smsHref = sanitizePhoneForSms(formattedPhone, defaultCountryCode);
  const waHref = sanitizePhoneForWhatsApp(formattedPhone, defaultCountryCode);

  const canCall = showCall && !disabled && (Boolean(telHref) || Boolean(onCall));
  const canSms = showSms && !disabled && (Boolean(smsHref) || Boolean(onSms));
  const canWa = showWhatsApp && !disabled && (Boolean(waHref) || Boolean(onWhatsApp));
  const canCopy = showCopy && Boolean(formattedPhone);

  const targetName = name ? ` (${name})` : "";
  const callLabel = labels?.call ? `${labels.call}${targetName}` : `Call ${formattedPhone}${targetName}`;
  const smsLabel = labels?.sms ? `${labels.sms}${targetName}` : `SMS ${formattedPhone}${targetName}`;
  const waLabel = labels?.whatsapp ? `${labels.whatsapp}${targetName}` : `WhatsApp ${formattedPhone}${targetName}`;

  const actionsNode = (
    <div
      className={cn("flex items-center gap-1", actionsClassName)}
      onClick={(e) => e.stopPropagation()}
    >
      {canCall ? (
        <ActionIconButton
          icon={Phone}
          label={callLabel}
          tooltipText={callLabel}
          href={onCall ? undefined : telHref}
          toneClass={MESSAGING_ICON_BTN_TONES.call}
          onClick={onCall}
        />
      ) : null}
      {canWa ? (
        <ActionIconButton
          icon={MessageCircle}
          label={waLabel}
          tooltipText={waLabel}
          href={onWhatsApp ? undefined : waHref}
          target="_blank"
          rel="noopener noreferrer"
          toneClass={MESSAGING_ICON_BTN_TONES.whatsapp}
          onClick={onWhatsApp}
        />
      ) : null}
      {canSms ? (
        <ActionIconButton
          icon={MessageSquare}
          label={smsLabel}
          tooltipText={smsLabel}
          href={onSms ? undefined : smsHref}
          toneClass={MESSAGING_ICON_BTN_TONES.sms}
          onClick={onSms}
        />
      ) : null}
      {canCopy ? (
        <ActionCopyButton
          text={formattedPhone}
          copyToastMessage={copyToast}
          tooltipCopyText={labels?.copy}
          tooltipCopiedText={labels?.copied}
        />
      ) : null}
    </div>
  );

  if (variant === "actions-only") {
    return <TooltipProvider delayDuration={200}>{actionsNode}</TooltipProvider>;
  }

  if (variant === "pill") {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            WORK_SURFACE_INNER,
            "w-full flex items-center justify-between text-xs font-normal text-muted-foreground hover:bg-muted/65 hover:text-foreground px-3 py-1.5 rounded-xl group/pill min-w-0 transition-colors gap-2",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
            <Phone
              aria-hidden="true"
              className="w-3.5 h-3.5 text-primary/80 flex-shrink-0 group-hover/pill:text-primary transition-colors"
            />
            <span className="font-semibold tracking-tight truncate select-all">{formattedPhone}</span>
          </div>
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  const valueDisplayNode = (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 max-w-full">
      {countryCode ? (
        <span className="text-xs font-semibold text-muted-foreground shrink-0">{countryCode}</span>
      ) : null}
      <span className="text-sm font-mono text-foreground font-medium tracking-wide truncate select-all">
        {phoneDisplay}
      </span>
    </div>
  );

  if (variant === "inline") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          {valueDisplayNode}
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  // Default: stacked layout
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col items-start gap-1 group/phone", className)}>
        {valueDisplayNode}
        {actionsNode}
      </div>
    </TooltipProvider>
  );
});

export interface ContactEmailActionProps {
  /** Email address */
  email?: string | null;
  /** Contact display name for aria-labels and tooltips */
  name?: string;
  /** Visual presentation variant. Default is "stacked". */
  variant?: ContactActionVariant;
  /** Whether to show the Copy button. Default true. */
  showCopy?: boolean;
  /** Whether to show the Mail mailto: action. Default true. */
  showMail?: boolean;
  /** Custom handler for Email click. If omitted, opens mailto:... */
  onEmail?: () => void;
  /** When true, disable/hide actions (e.g. archived records). */
  disabled?: boolean;
  /** Fallback placeholder when email is null/empty. Default is "—". */
  emptyFallback?: ReactNode;
  /** Toast message on copy */
  copyToast?: string;
  /** Custom container class */
  className?: string;
  /** Custom action buttons row class */
  actionsClassName?: string;
  /** Custom labels for action tooltips / aria */
  labels?: {
    mail?: string;
    copy?: string;
    copied?: string;
  };
}

export const ContactEmailAction = React.memo(function ContactEmailAction({
  email,
  name,
  variant = "stacked",
  showCopy = true,
  showMail = true,
  onEmail,
  disabled = false,
  emptyFallback = <span className="text-sm text-muted-foreground/60">—</span>,
  copyToast,
  className,
  actionsClassName,
  labels,
}: ContactEmailActionProps): React.JSX.Element | null {
  const cleanEmail = (email || "").trim();

  if (!cleanEmail) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  const mailHref = sanitizeEmailForMailto(cleanEmail);
  const canMail = showMail && !disabled && (Boolean(mailHref) || Boolean(onEmail));
  const canCopy = showCopy && Boolean(cleanEmail);

  const targetName = name ? ` (${name})` : "";
  const mailLabel = labels?.mail ? `${labels.mail}${targetName}` : `Email ${cleanEmail}${targetName}`;

  const actionsNode = (
    <div
      className={cn("flex items-center gap-1", actionsClassName)}
      onClick={(e) => e.stopPropagation()}
    >
      {canMail ? (
        <ActionIconButton
          icon={Mail}
          label={mailLabel}
          tooltipText={mailLabel}
          href={onEmail ? undefined : mailHref}
          toneClass={MESSAGING_ICON_BTN_TONES.email}
          onClick={onEmail}
        />
      ) : null}
      {canCopy ? (
        <ActionCopyButton
          text={cleanEmail}
          copyToastMessage={copyToast}
          tooltipCopyText={labels?.copy}
          tooltipCopiedText={labels?.copied}
        />
      ) : null}
    </div>
  );

  if (variant === "actions-only") {
    return <TooltipProvider delayDuration={200}>{actionsNode}</TooltipProvider>;
  }

  if (variant === "pill") {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            WORK_SURFACE_INNER,
            "w-full flex items-center justify-between text-xs font-normal text-muted-foreground hover:bg-muted/65 hover:text-foreground px-3 py-1.5 rounded-xl group/pill min-w-0 transition-colors gap-2",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
            <Mail
              aria-hidden="true"
              className="w-3.5 h-3.5 text-primary/80 flex-shrink-0 group-hover/pill:text-primary transition-colors"
            />
            <span className="font-semibold tracking-tight truncate select-all">{cleanEmail}</span>
          </div>
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  const valueDisplayNode = (
    <span
      className="max-w-full truncate text-sm text-muted-foreground font-medium select-all"
      title={cleanEmail}
    >
      {cleanEmail}
    </span>
  );

  if (variant === "inline") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
          {valueDisplayNode}
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  // Default: stacked layout
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex min-w-0 flex-col items-start gap-1 group/email", className)}>
        {valueDisplayNode}
        {actionsNode}
      </div>
    </TooltipProvider>
  );
});

export interface ContactLocationActionProps {
  /** Physical address text or map search query */
  address?: string | null;
  /** Address display text (if different from query) */
  addressDisplay?: string | null;
  /** Custom map URL (defaults to Google Maps search query) */
  mapsHref?: string | null;
  /** Optional address label (e.g. "Home", "Office") */
  label?: string;
  /** Visual presentation variant. Default is "stacked". */
  variant?: ContactActionVariant;
  /** Whether to show the Copy button. Default true. */
  showCopy?: boolean;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Custom fallback element when address is empty */
  emptyFallback?: ReactNode;
  /** Toast message shown upon copying */
  copyToast?: string;
  /** Optional custom labels */
  labels?: {
    location?: string;
    copy?: string;
    copied?: string;
  };
  className?: string;
}

/**
 * Reusable location / address action component with Map and Copy buttons.
 */
export const ContactLocationAction = React.memo(function ContactLocationAction({
  address,
  addressDisplay,
  mapsHref,
  label,
  variant = "stacked",
  showCopy = true,
  disabled = false,
  emptyFallback = null,
  copyToast,
  labels,
  className,
}: ContactLocationActionProps): React.JSX.Element | null {
  const cleanAddress = (address || "").trim();
  const displayText = (addressDisplay || cleanAddress).trim();

  if (!cleanAddress && !displayText) {
    return <>{emptyFallback}</>;
  }

  const effectiveMapsHref =
    mapsHref || (cleanAddress ? `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}` : null);

  const locationLabel = labels?.location || "Open in Maps";
  const copyLabel = labels?.copy || "Copy";
  const copiedLabel = labels?.copied || "Copied";

  const actionsNode = (
    <div className="flex items-center gap-1 shrink-0 select-none">
      {effectiveMapsHref && !disabled ? (
        <ActionIconButton
          icon={MapPin}
          label={locationLabel}
          tooltipText={locationLabel}
          href={effectiveMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          toneClass={MESSAGING_ICON_BTN_TONES.location}
        />
      ) : null}
      {showCopy && displayText && !disabled ? (
        <ActionCopyButton
          text={displayText}
          copyToastMessage={copyToast}
          tooltipCopyText={copyLabel}
          tooltipCopiedText={copiedLabel}
        />
      ) : null}
    </div>
  );

  if (variant === "actions-only") {
    return <TooltipProvider delayDuration={200}>{actionsNode}</TooltipProvider>;
  }

  if (variant === "pill") {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            WORK_SURFACE_INNER,
            "w-full flex items-center justify-between text-xs font-normal text-muted-foreground hover:bg-muted/65 hover:text-foreground px-3 py-1.5 rounded-xl group/pill min-w-0 transition-colors gap-2",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
            <MapPin
              aria-hidden="true"
              className="w-3.5 h-3.5 text-warning/80 flex-shrink-0 group-hover/pill:text-warning transition-colors"
            />
            <span className="font-semibold tracking-tight truncate select-all">{displayText}</span>
            {label ? (
              <span className="text-2xs uppercase font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                {label}
              </span>
            ) : null}
          </div>
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  const valueDisplayNode = (
    <span
      className="max-w-full truncate text-sm text-muted-foreground font-medium select-all"
      title={displayText}
    >
      {displayText}
      {label ? (
        <span className="ms-1.5 text-xs text-muted-foreground/70 font-normal">({label})</span>
      ) : null}
    </span>
  );

  if (variant === "inline") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
          {valueDisplayNode}
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  // Default: stacked layout
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex min-w-0 flex-col items-start gap-1 group/location", className)}>
        {valueDisplayNode}
        {actionsNode}
      </div>
    </TooltipProvider>
  );
});

export interface ContactLinkActionProps {
  /** Target link URL */
  href?: string | null;
  /** Display label / URL string */
  text?: string | null;
  /** Optional link tag or platform label */
  label?: string;
  /** Visual presentation variant. Default is "stacked". */
  variant?: ContactActionVariant;
  /** Whether to show the Copy button. Default true. */
  showCopy?: boolean;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Custom fallback element when link is empty */
  emptyFallback?: ReactNode;
  /** Toast message shown upon copying */
  copyToast?: string;
  /** Optional custom labels */
  labels?: {
    link?: string;
    copy?: string;
    copied?: string;
  };
  className?: string;
}

/**
 * Reusable link / website action component with ExternalLink and Copy buttons.
 */
export const ContactLinkAction = React.memo(function ContactLinkAction({
  href,
  text,
  label,
  variant = "stacked",
  showCopy = true,
  disabled = false,
  emptyFallback = null,
  copyToast,
  labels,
  className,
}: ContactLinkActionProps): React.JSX.Element | null {
  const cleanHref = (href || "").trim();
  const displayText = (text || cleanHref).trim();

  if (!cleanHref && !displayText) {
    return <>{emptyFallback}</>;
  }

  const effectiveUrl =
    cleanHref.startsWith("http://") || cleanHref.startsWith("https://")
      ? cleanHref
      : cleanHref ? `https://${cleanHref}` : null;

  const linkLabel = labels?.link || "Open Link";
  const copyLabel = labels?.copy || "Copy";
  const copiedLabel = labels?.copied || "Copied";

  const actionsNode = (
    <div className="flex items-center gap-1 shrink-0 select-none">
      {effectiveUrl && !disabled ? (
        <ActionIconButton
          icon={ExternalLink}
          label={linkLabel}
          tooltipText={linkLabel}
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          toneClass={MESSAGING_ICON_BTN_TONES.link}
        />
      ) : null}
      {showCopy && displayText && !disabled ? (
        <ActionCopyButton
          text={displayText}
          copyToastMessage={copyToast}
          tooltipCopyText={copyLabel}
          tooltipCopiedText={copiedLabel}
        />
      ) : null}
    </div>
  );

  if (variant === "actions-only") {
    return <TooltipProvider delayDuration={200}>{actionsNode}</TooltipProvider>;
  }

  if (variant === "pill") {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            WORK_SURFACE_INNER,
            "w-full flex items-center justify-between text-xs font-normal text-muted-foreground hover:bg-muted/65 hover:text-foreground px-3 py-1.5 rounded-xl group/pill min-w-0 transition-colors gap-2",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
            <ExternalLink
              aria-hidden="true"
              className="w-3.5 h-3.5 text-primary/80 flex-shrink-0 group-hover/pill:text-primary transition-colors"
            />
            <span className="font-semibold tracking-tight truncate select-all">{displayText}</span>
            {label ? (
              <span className="text-2xs uppercase font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                {label}
              </span>
            ) : null}
          </div>
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  const valueDisplayNode = (
    <span
      className="max-w-full truncate text-sm text-muted-foreground font-medium select-all"
      title={displayText}
    >
      {displayText}
      {label ? (
        <span className="ms-1.5 text-xs text-muted-foreground/70 font-normal">({label})</span>
      ) : null}
    </span>
  );

  if (variant === "inline") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
          {valueDisplayNode}
          {actionsNode}
        </div>
      </TooltipProvider>
    );
  }

  // Default: stacked layout
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex min-w-0 flex-col items-start gap-1 group/link", className)}>
        {valueDisplayNode}
        {actionsNode}
      </div>
    </TooltipProvider>
  );
});

export type ContactActionProps =
  | ({ type: "phone" } & ContactPhoneActionProps)
  | ({ type: "email" } & ContactEmailActionProps)
  | ({ type: "location" } & ContactLocationActionProps)
  | ({ type: "link" } & ContactLinkActionProps);

/**
 * Unified contact action component for Phone, Email, Location, and Link channels with Call, SMS, WhatsApp, Mail, Maps, ExternalLink, and Copy actions.
 */
export const ContactAction = React.memo(function ContactAction(props: ContactActionProps): React.JSX.Element | null {
  if (props.type === "phone") {
    const { type: _, ...rest } = props;
    return <ContactPhoneAction {...rest} />;
  }
  if (props.type === "email") {
    const { type: _, ...rest } = props;
    return <ContactEmailAction {...rest} />;
  }
  if (props.type === "location") {
    const { type: _, ...rest } = props;
    return <ContactLocationAction {...rest} />;
  }
  const { type: _, ...rest } = props;
  return <ContactLinkAction {...rest} />;
});
