import React, { type JSX } from "react";
import { Mail, Phone, type LucideIcon } from "lucide-react";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface DirectoryCardInfoPillProps {
  icon: LucideIcon;
  text: string;
  copyText: string;
}

/** Single phone/email face pill for Work directory entity cards. */
export const DirectoryCardInfoPill = React.memo(function DirectoryCardInfoPill({
  icon: Icon,
  text,
  copyText,
}: DirectoryCardInfoPillProps): JSX.Element {
  return (
    <div
      className={cn(
        WORK_SURFACE_INNER,
        "w-full flex items-center justify-between text-xs font-normal text-muted-foreground hover:bg-muted/65 hover:text-foreground px-3 py-1.5 rounded-xl group/pill min-w-0",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
        <Icon
          aria-hidden="true"
          className="w-3.5 h-3.5 text-primary/80 flex-shrink-0 group-hover/pill:text-primary transition-colors"
        />
        <span className="font-semibold tracking-tight truncate select-all">{text}</span>
      </div>
      <CopyBtn
        text={copyText}
        showToast
        className="min-h-11 min-w-11 opacity-60 transition-opacity text-muted-foreground hover:text-foreground group-hover/pill:opacity-100"
      />
    </div>
  );
});

export interface DirectoryCardInfoPillsProps {
  phone?: string | null;
  phoneDisplay?: string | null;
  countryCode?: string | null;
  email?: string | null;
  showPhone?: boolean;
  showEmail?: boolean;
}

/** Phone/email face pills stack for Work directory entity cards. */
export const DirectoryCardInfoPills = React.memo(function DirectoryCardInfoPills({
  phone,
  phoneDisplay,
  countryCode,
  email,
  showPhone = true,
  showEmail = true,
}: DirectoryCardInfoPillsProps): JSX.Element | null {
  const phoneText = phone
    ? countryCode
      ? `${countryCode} ${phoneDisplay || phone}`
      : phoneDisplay || phone
    : null;
  const showPhonePill = showPhone && Boolean(phone);
  const showEmailPill = showEmail && Boolean(email);
  if (!showPhonePill && !showEmailPill) return null;

  return (
    <div className="space-y-2 py-0.5 ms-1">
      {showPhonePill && phone && phoneText ? (
        <DirectoryCardInfoPill icon={Phone} text={phoneText} copyText={phone} />
      ) : null}
      {showEmailPill && email ? (
        <DirectoryCardInfoPill icon={Mail} text={email} copyText={email} />
      ) : null}
    </div>
  );
});

