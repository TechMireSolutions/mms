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
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { useTranslation } from "@/hooks/useTranslation";
import type { CSSProperties } from "react";
import { contactStickyCellBg } from "@/tenant/features/contacts/components/contactTableTypes";

type Translate = ReturnType<typeof useTranslation>["t"];

export function renderContactNameCell({
  contact,
  displayName,
  widthStyle,
  showArchived,
  isSelected,
  t,
  onView,
}: {
  contact: Contact;
  displayName: string;
  widthStyle: CSSProperties | undefined;
  showArchived: boolean;
  isSelected: boolean;
  t: Translate;
  onView?: (contact: Contact) => void;
}): React.JSX.Element {
  return (
    <TableCell
      key="name"
      className={cn(
        "px-4 py-3 sticky start-12 z-10 transition-colors border-e border-border/30",
        contactStickyCellBg(isSelected),
      )}
      style={widthStyle}
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          id={contact.id}
          name={displayName}
          avatar={contact.avatar}
          className="w-8 h-8 shrink-0 rounded-full text-xs"
        />
        <div className="min-w-0">
          <Button
            onClick={() => onView?.(contact)}
            variant="ghost"
            className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
            type="button"
            title={displayName}
          >
            <span className="block truncate">{displayName}</span>
          </Button>
          <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} className="mt-0.5" />
          {showArchived && contact.deletionReason && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {t("contacts.deletionReasonLabel")}: {contact.deletionReason}
            </p>
          )}
        </div>
      </div>
    </TableCell>
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
    <TableCell key="phone" className="px-4 py-3" style={widthStyle}>
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
                  className={cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.whatsapp, "p-0 cursor-pointer")}
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
    </TableCell>
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
    <TableCell key="email" className="px-4 py-3" style={widthStyle}>
      <div className="flex min-w-0 flex-col items-start gap-1 group/email">
        <span className="max-w-full truncate text-sm text-muted-foreground" title={primaryEmail || undefined}>
          {primaryEmail || t("contacts.table.emptyDash")}
        </span>
        {primaryEmail && (
          <div className="flex items-center gap-1">
            <CopyBtn text={primaryEmail} />
          </div>
        )}
      </div>
    </TableCell>
  );
}
