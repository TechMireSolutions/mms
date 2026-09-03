import React from "react";
import {
  formatCnic,
  getContactTags,
  isRelationshipWorkColumnKey,
  type Contact,
  type ContactPreferences,
} from "@mms/shared";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { TableCell } from "@/components/ui/table";
import { buildContactsMap, formatContactCellValue } from "@/lib/contacts/contactI18n";
import {
  renderSocialMetadata,
  renderRelationshipMetadata,
  renderEducationMetadata,
  renderExperienceMetadata,
  renderSkillsMetadata,
} from "@/tenant/features/contacts/components/contactMetadataCollections";
import {
  renderLunarDobMetadata,
  renderSolarDobMetadata,
} from "@/tenant/features/contacts/components/contactMetadataDates";
import {
  renderEducationSubField,
  renderExperienceSubField,
  renderSkillsSubField,
} from "@/tenant/features/contacts/components/contactMetadataSubFields";
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

  const contactsMap = (() => {
    if (externalContactsMap !== undefined) return externalContactsMap;
    return buildContactsMap(allContacts);
  })();

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
        return renderWhatsAppMetadata({ contact });
      case "socials":
      case "socials_platform":
      case "socials_url":
        return renderSocialMetadata({
          contact,
          emptyNode: renderDash(),
          t,
        });
      case "cnic": {
        if (!contact.cnic) return renderDash();
        return <span className="font-mono">{formatCnic(contact.cnic) || contact.cnic}</span>;
      }
      case "tag":
      case "tags": {
        const contactTags = getContactTags(contact);
        if (contactTags.length === 0) return renderDash();
        return (
          <div className="flex flex-wrap gap-1">
            {contactTags.map((tag) => (
              <Badge key={tag} tone="primary" className="px-2 py-0.5 text-xs font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        );
      }
      case "notes": {
        if (!contact.notes) return renderDash();
        return (
          <span className="truncate max-w-50 block" title={contact.notes}>
            {contact.notes}
          </span>
        );
      }
      case "education":
        return renderEducationMetadata({
          contact,
          emptyNode: renderDash(),
        });
      case "experience":
        return renderExperienceMetadata({
          contact,
          emptyNode: renderDash(),
        });
      case "skills":
        return renderSkillsMetadata({
          contact,
          emptyNode: renderDash(),
        });
      default: {
        const eduSub = renderEducationSubField(colId, contact, renderJoinedList);
        if (eduSub !== null) return eduSub;

        const expSub = renderExperienceSubField(colId, contact, renderJoinedList);
        if (expSub !== null) return expSub;

        const skillSub = renderSkillsSubField({
          colId,
          contact,
          renderJoinedList,
          emptyNode: renderDash(),
          t,
        });
        if (skillSub !== null) return skillSub;

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
