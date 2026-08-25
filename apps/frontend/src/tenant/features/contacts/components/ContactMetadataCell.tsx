import React, { useMemo } from "react";
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
  renderAddressFieldMetadata,
  renderGenderMetadata,
  renderSyedMetadata,
  renderWhatsAppMetadata,
} from "@/tenant/features/contacts/components/contactMetadataIdentity";

interface ContactMetadataCellProps {
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
      case "preferredLanguage": {
        if (!contact.preferredLanguage) return renderDash();
        return <span>{contact.preferredLanguage}</span>;
      }
      case "preferredContactMethod": {
        if (!contact.preferredContactMethod) return renderDash();
        return <span>{contact.preferredContactMethod}</span>;
      }
      case "doNotContact": {
        if (contact.doNotContact) {
          return (
            <Badge tone="destructive" className="px-2 py-0.5 text-xs font-medium">
              {t("contacts.columns.doNotContact")}
            </Badge>
          );
        }
        return renderDash();
      }
      case "education":
        return renderEducationMetadata({
          contact,
          emptyNode: renderDash(),
        });
      case "education_degree":
      case "educationDegree": {
        const degrees = (contact.education || []).map((e) => e.degree?.trim()).filter(Boolean);
        return renderJoinedList(degrees, true);
      }
      case "education_institution":
      case "educationInstitution": {
        const institutions = (contact.education || []).map((e) => e.institution?.trim()).filter(Boolean);
        return renderJoinedList(institutions, true);
      }
      case "education_fieldOfStudy":
      case "educationFieldOfStudy": {
        const fieldsOfStudy = (contact.education || []).map((e) => e.fieldOfStudy?.trim()).filter(Boolean);
        return renderJoinedList(fieldsOfStudy, true);
      }
      case "education_year":
      case "educationYear": {
        const years = (contact.education || []).map((e) => e.year?.trim()).filter(Boolean);
        return renderJoinedList(years, true);
      }
      case "education_grade":
      case "educationGrade": {
        const grades = (contact.education || []).map((e) => e.grade?.trim()).filter(Boolean);
        return renderJoinedList(grades, true);
      }
      case "experience":
        return renderExperienceMetadata({
          contact,
          emptyNode: renderDash(),
        });
      case "experience_title":
      case "experienceTitle": {
        const titles = (contact.experience || []).map((e) => e.title?.trim()).filter(Boolean);
        return renderJoinedList(titles, true);
      }
      case "experience_organization":
      case "experienceOrganization": {
        const orgs = (contact.experience || []).map((e) => e.organization?.trim()).filter(Boolean);
        return renderJoinedList(orgs, true);
      }
      case "experience_employmentType":
      case "experienceEmploymentType": {
        const types = (contact.experience || []).map((e) => e.employmentType?.trim()).filter(Boolean);
        return renderJoinedList(types, true);
      }
      case "experience_location":
      case "experienceLocation": {
        const locations = (contact.experience || []).map((e) => e.location?.trim()).filter(Boolean);
        return renderJoinedList(locations, true);
      }
      case "skills":
        return renderSkillsMetadata({
          contact,
          emptyNode: renderDash(),
        });
      case "skills_name":
      case "skillsName": {
        const names = (contact.skills || []).map((s) => s.name?.trim()).filter(Boolean);
        return renderJoinedList(names, true);
      }
      case "skills_category":
      case "skillsCategory": {
        const categories = (contact.skills || []).map((s) => s.category?.trim()).filter(Boolean);
        return renderJoinedList(categories, true);
      }
      case "skills_proficiency":
      case "skillsProficiency": {
        const proficiencies = (contact.skills || []).map((s) => s.proficiency?.trim()).filter(Boolean);
        return renderJoinedList(proficiencies, true);
      }
      case "skills_yearsOfExperience":
      case "skillsYearsOfExperience": {
        const years = (contact.skills || []).map((s) => s.yearsOfExperience?.trim()).filter(Boolean);
        return renderJoinedList(years, true);
      }
      case "skills_isCertified":
      case "skillsIsCertified": {
        const certified = (contact.skills || []).some((s) => s.isCertified);
        return certified ? (
          <Badge tone="success" className="px-2 py-0.5 text-xs font-medium">
            {t("contacts.columns.skillsIsCertified")}
          </Badge>
        ) : (
          renderDash()
        );
      }
      case "skills_issuer":
      case "skillsIssuer": {
        const issuers = (contact.skills || []).map((s) => s.issuer?.trim()).filter(Boolean);
        return renderJoinedList(issuers, true);
      }
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
