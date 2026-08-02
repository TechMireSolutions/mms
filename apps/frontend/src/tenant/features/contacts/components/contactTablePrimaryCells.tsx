import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPrimaryEmail,
  hasWhatsApp,
  type Contact,
  type ContactPreferences,
} from "@mms/shared";
import { resolveContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyBtn } from "@/components/ui/CopyBtn";
import type { useTranslation } from "@/hooks/useTranslation";
import type { CSSProperties } from "react";

type Translate = ReturnType<typeof useTranslation>["t"];

export function renderContactNameCell({
  contact,
  displayName,
  widthStyle,
  showArchived,
  t,
  onView,
}: {
  contact: Contact;
  displayName: string;
  widthStyle: CSSProperties | undefined;
  showArchived: boolean;
  t: Translate;
  onView?: (contact: Contact) => void;
}): React.JSX.Element {
  return (
    <td
      key="name"
      className="px-4 py-3 sticky start-12 z-10 bg-card group-hover:bg-muted/40 transition-colors border-e border-border/30"
      style={widthStyle}
    >
      <div className="flex items-center gap-3">
        <UserAvatar
          id={contact.id}
          name={displayName}
          avatar={contact.avatar}
          className="w-8 h-8 rounded-full text-xs"
        />
        <div>
          <Button
            onClick={() => onView?.(contact)}
            variant="ghost"
            className="min-h-11 h-auto p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
            type="button"
          >
            {displayName}
          </Button>
          <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} className="mt-0.5" />
          {showArchived && contact.deletionReason && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {t("contacts.deletionReasonLabel")}: {contact.deletionReason}
            </p>
          )}
        </div>
      </div>
    </td>
  );
}

export function renderContactPhoneCell({
  contact,
  prefs,
  countryCodesMap,
  countryCodes,
  widthStyle,
  t,
  onWhatsApp,
}: {
  contact: Contact;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  widthStyle: CSSProperties | undefined;
  t: Translate;
  onWhatsApp?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { phone: primaryPhone, countryCode, phoneDisplay: formattedNumber } = resolveContactPhoneDisplay(
    contact,
    prefs,
    countryCodesMap,
    countryCodes,
  );
  const hasWa = hasWhatsApp(contact);

  return (
    <td key="phone" className="px-4 py-3" style={widthStyle}>
      <div className="flex flex-col items-start gap-1 group/phone">
        {primaryPhone ? (
          <>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
              {countryCode && <span className="text-xs font-semibold text-muted-foreground">{countryCode}</span>}
              <span className="text-sm font-mono text-foreground font-medium tracking-wide">
                {formattedNumber}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {onWhatsApp && hasWa ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsApp([contact]);
                  }}
                  title={t("contacts.whatsapp")}
                  aria-label={t("contacts.whatsapp")}
                  variant="ghost"
                  className="min-h-11 min-w-11 flex items-center justify-center p-0 rounded transition-all hover:bg-muted/80 text-success hover:text-success/80 cursor-pointer"
                  type="button"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              ) : null}
              <CopyBtn text={primaryPhone} />
            </div>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{t("contacts.table.emptyDash")}</span>
        )}
      </div>
    </td>
  );
}

export function renderContactEmailCell({
  contact,
  widthStyle,
  t,
}: {
  contact: Contact;
  widthStyle: CSSProperties | undefined;
  t: Translate;
}): React.JSX.Element {
  const primaryEmail = getPrimaryEmail(contact);
  return (
    <td key="email" className="px-4 py-3" style={widthStyle}>
      <div className="flex flex-col items-start gap-1 group/email">
        <span className="text-sm text-muted-foreground">{primaryEmail || t("contacts.table.emptyDash")}</span>
        {primaryEmail && (
          <div className="flex items-center gap-1">
            <CopyBtn text={primaryEmail} />
          </div>
        )}
      </div>
    </td>
  );
}
