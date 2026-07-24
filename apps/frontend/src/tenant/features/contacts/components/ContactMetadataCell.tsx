import React, { useMemo } from "react";
import { User, CheckCircle2, MapPin } from "lucide-react";
import {
  Contact,
  hasWhatsApp,
  ContactPreferences,
  COLOR_PALETTES,
  formatDate,
  calculateDetailedSolarAge,
  getLunarDateString,
  calculateDetailedLunarAge,
  getPrimaryAddress,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { buildContactsMap, formatContactCellValue, formatContactGenderLabel } from "@/lib/contacts/contactI18n";

export interface ContactMetadataCellProps {
  colId: string;
  contact: Contact;
  prefs: Pick<ContactPreferences, "showDetailedSolarAge" | "showLunarDob" | "showDetailedLunarAge">;
  allContacts?: Contact[];
  contactsMap?: Map<string, Contact> | null;
  variant?: "table" | "card";
}

/**
 * DRY component for rendering contact table cells and card metadata attributes
 * based on column key and user field preferences (globle1 §3.3).
 */
export function ContactMetadataCell({
  colId,
  contact,
  prefs,
  allContacts = [],
  contactsMap: externalContactsMap,
  variant = "table",
}: ContactMetadataCellProps): React.JSX.Element {
  const { t, language } = useTranslation();

  const contactsMap = useMemo(() => {
    if (externalContactsMap !== undefined) return externalContactsMap;
    return buildContactsMap(allContacts);
  }, [allContacts, externalContactsMap]);

  const renderDash = (): React.ReactNode => (
    <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
  );

  const renderJoinedList = (items: (string | undefined | null)[], showTitle = false): React.ReactNode => {
    const valid = items.filter(Boolean) as string[];
    if (valid.length === 0) return renderDash();
    const joined = valid.join(", ");
    return (
      <span className="truncate" title={showTitle ? joined : undefined}>
        {joined}
      </span>
    );
  };

  const renderValue = (): React.ReactNode => {
    switch (colId) {
      case "gender": {
        const genderValue = contact.gender;
        if (!genderValue) return renderDash();
        return (
          <span className="flex items-center gap-1 capitalize">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {formatContactGenderLabel(genderValue, t)}
          </span>
        );
      }
      case "isSyed":
        return contact.isSyed ? (
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${COLOR_PALETTES.success.bg}`}>
            <CheckCircle2 className="w-3 h-3" />
            {t("contacts.table.yesSyed")}
          </span>
        ) : (
          renderDash()
        );

      case "city":
      case "country":
      case "state":
      case "line1": {
        const primaryAddr = getPrimaryAddress(contact);
        const addressValue =
          primaryAddr?.[colId as "city" | "country" | "state" | "line1"] ||
          (contact[colId as keyof Contact] as string | undefined);
        if (!addressValue) return renderDash();
        return (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span className="truncate">{String(addressValue)}</span>
          </span>
        );
      }
      case "dob": {
        if (!contact.dob) return renderDash();
        return (
          <div className="flex flex-col gap-0.5 text-[11px] font-mono leading-normal">
            <span>{formatDate(contact.dob)}</span>
            {prefs.showDetailedSolarAge && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.solarAgeLabel")} {calculateDetailedSolarAge(contact.dob, language)}
              </span>
            )}
            {prefs.showLunarDob && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.lunarDobLabel")} {getLunarDateString(contact.dob, language)}
              </span>
            )}
            {prefs.showDetailedLunarAge && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.lunarAgeLabel")} {calculateDetailedLunarAge(contact.dob, language)}
              </span>
            )}
          </div>
        );
      }
      case "whatsapp":
        return (
          <span
            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
              hasWhatsApp(contact)
                ? COLOR_PALETTES.success.bg
                : COLOR_PALETTES.slate.bg
            }`}
          >
            {hasWhatsApp(contact) ? t("common.yes") : t("common.no")}
          </span>
        );
      case "socials_platform":
        return renderJoinedList((contact.socials || []).map((s) => s.platform));
      case "socials_url":
        return renderJoinedList((contact.socials || []).map((s) => s.url), true);
      case "emergency_contact": {
        const names = (contact.emergencyContacts || []).map((ec) => {
          if (ec.name) return ec.name;
          if (ec.contactId) {
            const linked = contactsMap?.get(String(ec.contactId));
            return linked ? linked.name : `${t("contacts.table.contactIdPrefix")}${ec.contactId}`;
          }
          return null;
        });
        return renderJoinedList(names);
      }
      case "emergency_relationship":
        return renderJoinedList((contact.emergencyContacts || []).map((ec) => ec.relationship));
      default: {
        const raw = contact[colId as keyof Contact];
        const formatted = formatContactCellValue(raw, t);
        return formatted ? <span>{formatted}</span> : renderDash();
      }
    }
  };

  if (variant === "table") {
    return <td className="px-4 py-3">{renderValue()}</td>;
  }

  return <>{renderValue()}</>;
}
