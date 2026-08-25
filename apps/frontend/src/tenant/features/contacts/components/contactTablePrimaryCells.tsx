import { Button } from "@/components/ui/button";
import type { Contact, ContactPreferences } from "@mms/shared";
import {
  resolveAllContactPhones,
  resolveAllContactEmails,
} from "@/lib/contacts/contactI18n";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { useTranslation } from "@/hooks/useTranslation";
import type { CSSProperties } from "react";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";

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
        workTableStickyCellBg(isSelected),
      )}
      style={widthStyle}
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          id={contact.id}
          name={displayName}
          avatar={contact.avatar}
          size="md"
          className="shrink-0"
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
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">
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
  const allPhones = resolveAllContactPhones(contact, prefs, countryCodesMap, countryCodes);
  const displayName = contact.name || "";
  const emptyDash = <span className="text-sm text-muted-foreground">{t("contacts.table.emptyDash")}</span>;

  if (allPhones.length === 0) {
    return (
      <TableCell key="phone" className="px-4 py-3" style={widthStyle}>
        {emptyDash}
      </TableCell>
    );
  }

  return (
    <TableCell key="phone" className="px-4 py-3" style={widthStyle}>
      <div className="space-y-2 min-w-0">
        {allPhones.map((p, idx) => (
          <ContactPhoneAction
            key={`phone-${p.phone}-${idx}`}
            phone={p.phone}
            countryCode={p.countryCode}
            phoneDisplay={p.phoneDisplay}
            name={displayName}
            emptyFallback={emptyDash}
            copyToast={t("contacts.table.copied")}
            labels={{
              call: t("contacts.detail.call"),
              sms: t("contacts.sms"),
              whatsapp: t("contacts.whatsapp"),
              copy: t("contacts.table.copy"),
              copied: t("contacts.table.copied"),
            }}
            onWhatsApp={onWhatsApp ? () => onWhatsApp([contact]) : undefined}
          />
        ))}
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
  const allEmails = resolveAllContactEmails(contact);
  const displayName = contact.name || "";
  const emptyDash = <span className="text-sm text-muted-foreground">{t("contacts.table.emptyDash")}</span>;

  if (allEmails.length === 0) {
    return (
      <TableCell key="email" className="px-4 py-3" style={widthStyle}>
        {emptyDash}
      </TableCell>
    );
  }

  return (
    <TableCell key="email" className="px-4 py-3" style={widthStyle}>
      <div className="space-y-2 min-w-0">
        {allEmails.map((e, idx) => (
          <ContactEmailAction
            key={`email-${e.email}-${idx}`}
            email={e.email}
            name={displayName}
            emptyFallback={emptyDash}
            copyToast={t("contacts.table.copied")}
            labels={{
              mail: t("contacts.detail.emailAction"),
              copy: t("contacts.table.copy"),
              copied: t("contacts.table.copied"),
            }}
          />
        ))}
      </div>
    </TableCell>
  );
}
