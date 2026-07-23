import React from "react";
import { User, CheckCircle2, MapPin } from "lucide-react";
import {
  Contact,
  hasWhatsApp,
  ContactPreferences,
  formatDate,
  calculateDetailedSolarAge,
  getLunarDateString,
  calculateDetailedLunarAge,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactCellValue, formatContactGenderLabel } from "@/lib/contacts/contactI18n";

export interface ContactMetadataCellProps {
  colId: string;
  contact: Contact;
  prefs: Pick<ContactPreferences, "showDetailedSolarAge" | "showLunarDob" | "showDetailedLunarAge">;
  allContacts?: Contact[];
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
  variant = "table",
}: ContactMetadataCellProps): React.JSX.Element {
  const { t } = useTranslation();

  const renderValue = (): React.ReactNode => {
    switch (colId) {
      case "gender": {
        const genderValue = contact.gender;
        if (!genderValue) return <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>;
        return (
          <span className="flex items-center gap-1 capitalize">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {formatContactGenderLabel(genderValue, t)}
          </span>
        );
      }
      case "isSyed":
        return contact.isSyed ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-success/10 text-success rounded border border-success/20">
            <CheckCircle2 className="w-3 h-3" />
            {t("contacts.table.yesSyed")}
          </span>
        ) : (
          <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
        );

      case "city":
      case "country":
      case "state":
      case "line1": {
        const addressValue =
          contact.addresses?.[0]?.[colId as "city" | "country" | "state" | "line1"] ||
          (contact[colId as keyof Contact] as string | undefined);
        if (!addressValue) return <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>;
        return (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span className="truncate">{String(addressValue)}</span>
          </span>
        );
      }
      case "dob": {
        if (!contact.dob) return <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>;
        return (
          <div className="flex flex-col gap-0.5 text-[11px] font-mono leading-normal">
            <span>{formatDate(contact.dob)}</span>
            {prefs.showDetailedSolarAge && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.solarAgeLabel")} {calculateDetailedSolarAge(contact.dob)}
              </span>
            )}
            {prefs.showLunarDob && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.lunarDobLabel")} {getLunarDateString(contact.dob)}
              </span>
            )}
            {prefs.showDetailedLunarAge && (
              <span className="text-[10px] text-muted-foreground/80">
                {t("contacts.table.lunarAgeLabel")} {calculateDetailedLunarAge(contact.dob)}
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
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {hasWhatsApp(contact) ? t("common.yes") : t("common.no")}
          </span>
        );
      case "socials_platform": {
        const platforms = (contact.socials || []).map((s) => s.platform).filter(Boolean);
        return platforms.length > 0 ? (
          <span className="truncate">{platforms.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
        );
      }
      case "socials_url": {
        const urls = (contact.socials || []).map((s) => s.url).filter(Boolean);
        return urls.length > 0 ? (
          <span className="truncate" title={urls.join(", ")}>
            {urls.join(", ")}
          </span>
        ) : (
          <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
        );
      }
      case "emergency_contact": {
        const names = (contact.emergencyContacts || [])
          .map((ec) => {
            if (ec.name) return ec.name;
            if (ec.contactId) {
              const linked = allContacts.find((c) => String(c.id) === String(ec.contactId));
              return linked ? linked.name : `${t("contacts.table.contactIdPrefix")}${ec.contactId}`;
            }
            return null;
          })
          .filter(Boolean);
        return names.length > 0 ? (
          <span className="truncate">{names.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
        );
      }
      case "emergency_relationship": {
        const relationships = (contact.emergencyContacts || [])
          .map((ec) => ec.relationship)
          .filter(Boolean);
        return relationships.length > 0 ? (
          <span className="truncate">{relationships.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>
        );
      }
      default: {
        const raw = contact[colId as keyof Contact];
        const formatted = formatContactCellValue(raw, t);
        return formatted ? <span>{formatted}</span> : <span className="text-muted-foreground/40">{t("contacts.table.emptyDash")}</span>;
      }
    }
  };

  if (variant === "table") {
    return <td className="px-4 py-3">{renderValue()}</td>;
  }

  return <>{renderValue()}</>;
}
