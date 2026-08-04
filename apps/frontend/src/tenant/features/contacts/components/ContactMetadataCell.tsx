import React, { useMemo } from "react";
import {
  Contact,
  ContactPreferences,
  isRelationshipWorkColumnKey,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { TableCell } from "@/components/ui/table";
import { buildContactsMap, formatContactCellValue } from "@/lib/contacts/contactI18n";
import {
  renderSocialMetadata,
  renderRelationshipMetadata,
} from "@/tenant/features/contacts/components/contactMetadataCollections";
import {
  renderLunarDobMetadata,
  renderSolarDobMetadata,
} from "@/tenant/features/contacts/components/contactMetadataDates";
import {
  renderAddressFieldMetadata,
  renderGenderMetadata,
  renderSyedMetadata,
  renderWhatsAppMetadata,
} from "@/tenant/features/contacts/components/contactMetadataIdentity";

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
  const showDetailedSolarAge = prefs.showDetailedSolarAge !== false;
  const showLunarDob = Boolean(prefs.showLunarDob);
  const showDetailedLunarAge = Boolean(prefs.showDetailedLunarAge);

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
      case "gender":
        return renderGenderMetadata({ contact, emptyNode: renderDash(), t });
      case "isSyed":
        return renderSyedMetadata({ contact, emptyNode: renderDash(), t });
      case "city":
      case "country":
      case "state":
      case "line1":
        return renderAddressFieldMetadata({
          contact,
          colId,
          emptyNode: renderDash(),
        });
      case "solarDob":
      case "dob":
        return renderSolarDobMetadata({
          dob: contact.dob,
          showDetailedSolarAge,
          language,
          emptyNode: renderDash(),
        });
      case "lunarDob":
        return renderLunarDobMetadata({
          dob: contact.dob,
          showLunarDob,
          showDetailedLunarAge,
          language,
          emptyNode: renderDash(),
        });
      case "whatsapp":
        return renderWhatsAppMetadata({ contact, t });
      case "socials":
      case "socials_platform":
      case "socials_url":
        return renderSocialMetadata({
          contact,
          emptyNode: renderDash(),
          t,
        });
      default: {
        if (isRelationshipWorkColumnKey(colId)) {
          return renderRelationshipMetadata({
            contact,
            contactsMap,
            emptyNode: renderDash(),
            renderJoinedList,
            t,
          });
        }
        const raw = contact[colId as keyof Contact];
        const formatted = formatContactCellValue(raw, t);
        return formatted ? <span>{formatted}</span> : renderDash();
      }
    }
  };

  if (variant === "table") {
    return <TableCell className="px-4 py-3" style={style}>{renderValue()}</TableCell>;
  }

  return <>{renderValue()}</>;
}
