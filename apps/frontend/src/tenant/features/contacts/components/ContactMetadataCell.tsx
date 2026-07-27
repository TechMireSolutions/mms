import React, { useMemo } from "react";
import { User, CheckCircle2, MapPin, Globe, ExternalLink } from "lucide-react";
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
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

export interface ContactMetadataCellProps {
  colId: string;
  contact: Contact;
  prefs: Pick<ContactPreferences, "showDetailedSolarAge" | "showLunarDob" | "showDetailedLunarAge">;
  allContacts?: Contact[];
  contactsMap?: Map<string, Contact> | null;
  variant?: "table" | "card";
  style?: React.CSSProperties;
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
  style,
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
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${SEMANTIC_BADGE.success}`}>
            <CheckCircle2 className="w-3 h-3 text-success" />
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
      case "solarDob":
      case "dob": {
        if (!contact.dob) return renderDash();
        return (
          <div className="flex flex-col gap-0.5 text-[11px] leading-normal font-mono">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <span aria-hidden="true" className="text-amber-500 text-xs">☀️</span>
              <span>{formatDate(contact.dob)}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {calculateDetailedSolarAge(contact.dob, language)}
            </span>
          </div>
        );
      }
      case "lunarDob": {
        if (!contact.dob) return renderDash();
        return (
          <div className="flex flex-col gap-0.5 text-[11px] leading-normal font-mono">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <span aria-hidden="true" className="text-indigo-400 text-xs">🌙</span>
              <span>{getLunarDateString(contact.dob, language)}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {calculateDetailedLunarAge(contact.dob, language)}
            </span>
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
      case "socials":
      case "socials_platform":
      case "socials_url": {
        const socials = (contact.socials || []).filter((s) => (s.platform || "").trim().length > 0 || (s.url || "").trim().length > 0);
        if (socials.length === 0) return renderDash();
        return (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {socials.map((s, idx) => {
              const platformStr = (s.platform || "").trim();
              const urlStr = (s.url || "").trim();
              const href = urlStr ? (urlStr.startsWith("http") ? urlStr : `https://${urlStr}`) : undefined;
              const displayUrl = urlStr ? urlStr.replace(/^https?:\/\//i, "").replace(/\/$/, "") : "";
              const label = platformStr && displayUrl ? `${platformStr}: ${displayUrl}` : (platformStr || displayUrl);

              if (href) {
                return (
                  <a
                    key={idx}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-semibold transition-colors truncate max-w-[200px]"
                    title={`${platformStr || t("contacts.form.link")}: ${urlStr}`}
                  >
                    <Globe className="w-3 h-3 shrink-0 text-primary" />
                    <span className="truncate">{label}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </a>
                );
              }

              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/40 text-[11px] font-medium"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>{platformStr || displayUrl}</span>
                </span>
              );
            })}
          </div>
        );
      }
      case "emergency_contact":
      case "emergency_relationship": {
        const list = (contact.emergencyContacts || []).filter((ec) => (ec.name || "").trim() || ec.contactId || (ec.relationship || "").trim());
        if (list.length === 0) return renderDash();
        const items = list.map((ec) => {
          let nameStr = ec.name ? ec.name.trim() : "";
          if (!nameStr && ec.contactId) {
            const linked = contactsMap?.get(String(ec.contactId));
            nameStr = linked ? linked.name : `${t("contacts.table.contactIdPrefix")}${ec.contactId}`;
          }
          const relStr = ec.relationship ? ec.relationship.trim() : "";
          if (nameStr && relStr) return `${nameStr} (${relStr})`;
          return nameStr || relStr;
        });
        return renderJoinedList(items.filter(Boolean));
      }
      default: {
        const raw = contact[colId as keyof Contact];
        const formatted = formatContactCellValue(raw, t);
        return formatted ? <span>{formatted}</span> : renderDash();
      }
    }
  };

  if (variant === "table") {
    return <td className="px-4 py-3" style={style}>{renderValue()}</td>;
  }

  return <>{renderValue()}</>;
}
