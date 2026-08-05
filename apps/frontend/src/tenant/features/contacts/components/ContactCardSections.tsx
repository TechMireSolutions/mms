import type { JSX } from "react";
import { Mail, Phone, type LucideIcon } from "lucide-react";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export {
  ContactCardMetadataGrid,
  ContactCardDeletedBanner,
} from "@/tenant/features/contacts/components/ContactCardMetadataGrid";

function ContactInfoPill({
  icon: Icon,
  text,
  copyText,
}: {
  icon: LucideIcon;
  text: string;
  copyText: string;
}): JSX.Element {
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
        className="opacity-60 group-hover/pill:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      />
    </div>
  );
}

export function ContactCardInfoPills({
  phone,
  countryCode,
  phoneDisplay,
  email,
  showPhonePill,
  showEmailPill,
}: {
  phone: string | null;
  countryCode: string;
  phoneDisplay: string;
  email: string | null;
  showPhonePill: boolean;
  showEmailPill: boolean;
}): JSX.Element | null {
  if (!showPhonePill && !showEmailPill) {
    return null;
  }

  return (
    <div className="space-y-2 py-0.5 ms-1">
      {phone && showPhonePill && (
        <ContactInfoPill
          icon={Phone}
          text={countryCode ? `${countryCode} ${phoneDisplay}` : (phoneDisplay || phone)}
          copyText={phone}
        />
      )}
      {email && showEmailPill && (
        <ContactInfoPill
          icon={Mail}
          text={email}
          copyText={email}
        />
      )}
    </div>
  );
}
