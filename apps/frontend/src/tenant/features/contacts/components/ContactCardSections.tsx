import { Mail, Phone } from "lucide-react";
import { CopyBtn } from "@/components/ui/CopyBtn";

export {
  ContactCardMetadataGrid,
  ContactCardDeletedBanner,
} from "@/tenant/features/contacts/components/ContactCardMetadataGrid";

function ContactInfoPill({
  icon: Icon,
  text,
  copyText,
}: {
  icon: typeof Phone | typeof Mail;
  text: string;
  copyText: string;
}) {
  return (
    <div className="w-full flex items-center justify-between text-xs font-normal text-muted-foreground bg-muted/40 dark:bg-muted/20 hover:bg-muted/65 dark:hover:bg-muted/35 hover:text-foreground backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/30 dark:border-border/15 transition-all group/pill min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
        <Icon
          aria-hidden="true"
          className="w-3.5 h-3.5 text-primary/80 dark:text-primary/70 flex-shrink-0 group-hover/pill:text-primary transition-colors"
        />
        <span className="font-semibold tracking-tight truncate select-all">{text}</span>
      </div>
      <CopyBtn
        text={copyText}
        showToast
        className="h-6 w-6 opacity-60 group-hover/pill:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
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
}) {
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
