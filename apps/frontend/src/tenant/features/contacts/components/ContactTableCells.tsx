import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisplayName, getPrimaryEmail, hasWhatsApp, type Contact, type ContactPreferences } from "@mms/shared";
import { resolveContactPhoneDisplay } from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { ContactMetadataCell } from "@/tenant/features/contacts/components/ContactMetadataCell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyBtn } from "@/components/ui/CopyBtn";
import type { useTranslation } from "@/hooks/useTranslation";
import {
  columnWidthStyle,
  type ContactsColumnConfig,
} from "@/tenant/features/contacts/components/contactTableTypes";

type Translate = ReturnType<typeof useTranslation>["t"];

export function renderContactTableCell({
  col,
  contact,
  displayName,
  getColumnWidth,
  prefs,
  countryCodesMap,
  countryCodes,
  contactsMap,
  allContacts,
  showArchived,
  t,
  onView,
  onWhatsApp,
}: {
  col: ContactsColumnConfig;
  contact: Contact;
  displayName: string;
  getColumnWidth: (key: string) => number | undefined;
  prefs: ContactPreferences;
  countryCodesMap: Record<string, string>;
  countryCodes: Array<{ country: string; code: string }>;
  contactsMap: Map<string, Contact> | null;
  allContacts: Contact[];
  showArchived: boolean;
  t: Translate;
  onView?: (contact: Contact) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const width = getColumnWidth(col.id) ?? col.width;
  const widthStyle = columnWidthStyle(width);

  switch (col.id) {
    case "name":
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
                className="min-h-[44px] h-auto p-0 text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                type="button"
              >
                {displayName}
              </Button>
              <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} className="mt-0.5" />
              {showArchived && contact.deletionReason && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {t("contacts.deletionReasonLabel")}: {contact.deletionReason}
                </p>
              )}
            </div>
          </div>
        </td>
      );
    case "phone": {
      const { phone: primaryPhone, countryCode, phoneDisplay: formattedNumber } = resolveContactPhoneDisplay(
        contact,
        prefs,
        countryCodesMap,
        countryCodes,
      );
      const hasWa = hasWhatsApp(contact);

      return (
        <td key="phone" className="px-4 py-3" style={widthStyle}>
          <div className="flex items-center gap-2 group/phone">
            {primaryPhone ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60">
                {countryCode && <span className="text-[11px] font-semibold text-muted-foreground">{countryCode}</span>}
                <span className="text-[12px] font-mono text-foreground font-medium tracking-wide">
                  {formattedNumber}
                </span>
              </div>
            ) : (
              <span className="text-[13px] text-muted-foreground">{t("contacts.table.emptyDash")}</span>
            )}
            {primaryPhone && <CopyBtn text={primaryPhone} />}
            {onWhatsApp && hasWa ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp([contact]);
                }}
                title={t("contacts.whatsapp")}
                aria-label={t("contacts.whatsapp")}
                variant="ghost"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 transition-all hover:bg-transparent opacity-0 group-hover/phone:opacity-100 text-success hover:text-success/80 cursor-pointer"
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            ) : null}
          </div>
        </td>
      );
    }
    case "email": {
      const primaryEmail = getPrimaryEmail(contact);
      return (
        <td key="email" className="px-4 py-3" style={widthStyle}>
          <div className="flex items-center gap-1 group/email">
            <span className="text-[13px] text-muted-foreground">{primaryEmail || t("contacts.table.emptyDash")}</span>
            {primaryEmail && <CopyBtn text={primaryEmail} />}
          </div>
        </td>
      );
    }
    default:
      return (
        <ContactMetadataCell
          key={col.id}
          colId={col.id}
          contact={contact}
          prefs={prefs}
          allContacts={allContacts}
          contactsMap={contactsMap}
          variant="table"
          style={widthStyle}
        />
      );
  }
}

export function getContactTableDisplayName(contact: Contact): string {
  return getDisplayName(contact);
}
