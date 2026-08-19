import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactBasicTab } from "@/tenant/features/contacts/components/formTabs/ContactBasicTab";
import { ContactPhonesTab } from "@/tenant/features/contacts/components/formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "@/tenant/features/contacts/components/formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "@/tenant/features/contacts/components/formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "@/tenant/features/contacts/components/formTabs/ContactSocialsTab";
import { ContactEducationTab } from "@/tenant/features/contacts/components/formTabs/ContactEducationTab";
import { ContactExperienceTab } from "@/tenant/features/contacts/components/formTabs/ContactExperienceTab";
import { ContactSkillsTab } from "@/tenant/features/contacts/components/formTabs/ContactSkillsTab";
import { ContactRelationshipTab } from "@/tenant/features/contacts/components/formTabs/ContactRelationshipTab";
import { ContactCustomTab } from "@/tenant/features/contacts/components/formTabs/ContactCustomTab";
import type { ContactSubListTabBaseProps } from "@/tenant/features/contacts/components/formTabs/types";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import { normalizeContactFormTabId } from "@mms/shared";

export type ContactFormDraftState = ReturnType<typeof useContactFormDraft>;

export interface ContactFormTabContentProps {
  tab: string;
  draft: ContactFormDraftState;
  lockGender: boolean;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
}

function subListBaseProps(draft: ContactFormDraftState): ContactSubListTabBaseProps {
  return {
    contactDraft: draft.contactDraft,
    getLocalId: draft.getLocalId,
    getListItemError: draft.getListItemError,
    isFieldEnabled: draft.isFieldEnabled,
    isFieldRequired: draft.isFieldRequired,
    fields: draft.fields,
    formInstanceId: draft.formInstanceId,
    addSubListItem: draft.addSubListItem,
    ensureSubListItem: draft.ensureSubListItem,
    updateSubListItem: draft.updateSubListItem,
    removeSubListItem: draft.removeSubListItem,
  };
}

/**
 * Dispatches active ContactForm tab view rendering (Basic info vs nested collection lists vs custom tabs).
 */
export function ContactFormTabContent({
  tab,
  draft,
  lockGender,
  defaultCountry,
  defaultCity,
  defaultProvince,
}: ContactFormTabContentProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const normalizedTab = normalizeContactFormTabId(tab);

  const listBase = useMemo(() => subListBaseProps(draft), [
    draft.contactDraft,
    draft.getLocalId,
    draft.getListItemError,
    draft.isFieldEnabled,
    draft.isFieldRequired,
    draft.fields,
    draft.formInstanceId,
    draft.addSubListItem,
    draft.ensureSubListItem,
    draft.updateSubListItem,
    draft.removeSubListItem,
  ]);

  const renderTabBody = () => {
    if (normalizedTab === "basic") {
      return (
        <ContactBasicTab
          contactDraft={draft.contactDraft}
          formInstanceId={draft.formInstanceId}
          isFieldEnabled={draft.isFieldEnabled}
          isFieldRequired={draft.isFieldRequired}
          getFieldError={draft.getFieldError}
          updateDraft={draft.updateDraft}
          cropSrc={draft.cropSrc}
          setCropSrc={draft.setCropSrc}
          genders={draft.genders}
          onUpdateGenders={draft.updateGenders}
          lockGender={lockGender}
          handleAvatarChange={draft.handleAvatarChange}
          fields={draft.fields}
        />
      );
    }

    switch (normalizedTab) {
      case "phones":
        return (
          <ContactPhonesTab
            {...listBase}
            phoneLabels={draft.phoneLabels}
            onUpdatePhoneLabels={draft.updatePhoneLabels}
            defaultCountryCode={draft.defaultCountryCode}
            countryCodeOptions={draft.countryCodeOptions}
            onUpdateDialCodeOptions={draft.updateDialCodeOptions}
            handlePhoneBlur={draft.handlePhoneBlur}
          />
        );
      case "emails":
        return (
          <ContactEmailsTab
            {...listBase}
            emailLabels={draft.emailLabels}
            onUpdateEmailLabels={draft.updateEmailLabels}
          />
        );
      case "addresses":
        return (
          <ContactAddressesTab
            {...listBase}
            addressLabels={draft.addressLabels}
            onUpdateAddressLabels={draft.updateAddressLabels}
            countryOptions={draft.countryOptions}
            onUpdateCountryOptions={draft.updateCountryOptions}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            defaultCountry={defaultCountry}
          />
        );
      case "socials":
        return (
          <ContactSocialsTab
            {...listBase}
            socialPlatforms={draft.socialPlatforms}
            onUpdateSocialPlatforms={draft.updateSocialPlatforms}
          />
        );
      case "education":
        return (
          <ContactEducationTab
            {...listBase}
            degreeOptions={draft.educationDegrees}
            onUpdateDegreeOptions={draft.updateEducationDegrees}
          />
        );
      case "experience":
        return (
          <ContactExperienceTab
            {...listBase}
            employmentTypeOptions={draft.employmentTypes}
            onUpdateEmploymentTypeOptions={draft.updateEmploymentTypes}
          />
        );
      case "skills":
        return (
          <ContactSkillsTab
            {...listBase}
            categoryOptions={draft.skillCategories}
            onUpdateCategoryOptions={draft.updateSkillCategories}
            proficiencyOptions={draft.skillProficiencies}
            onUpdateProficiencyOptions={draft.updateSkillProficiencies}
          />
        );
      case "relationship":
        return (
          <ContactRelationshipTab
            {...listBase}
            relationshipOptions={draft.relationshipOptions}
            onUpdateRelationships={draft.updateRelationships}
          />
        );
      default: {
        const tabDef = (draft.fieldConfig?.formTabs ?? []).find(
          (tDef) =>
            tDef.key.toLowerCase() === tab.toLowerCase() ||
            tDef.key.toLowerCase() === normalizedTab.toLowerCase(),
        );
        const tabLabel = tabDef?.labelKey ? t(tabDef.labelKey) : (tabDef?.label || tab);
        return (
          <ContactCustomTab
            tabKey={tab}
            tabLabel={tabLabel}
            contactDraft={draft.contactDraft}
            fields={draft.fields}
            formInstanceId={draft.formInstanceId}
            isFieldEnabled={draft.isFieldEnabled}
            isFieldRequired={draft.isFieldRequired}
            getFieldError={draft.getFieldError}
            getListItemError={draft.getListItemError}
            updateDraft={draft.updateDraft}
            addSubListItem={draft.addSubListItem}
            ensureSubListItem={draft.ensureSubListItem}
            updateSubListItem={draft.updateSubListItem}
            removeSubListItem={draft.removeSubListItem}
            getLocalId={draft.getLocalId}
          />
        );
      }
    }
  };

  const body = renderTabBody();
  if (!body) return null;

  return (
    <div className="space-y-4">
      {draft.duplicateCount > 0 && (
        <WarningCallout
          tone="warning"
          density="compact"
          icon={AlertTriangle}
          description={t("contacts.duplicates.potentialDuplicatesAlert", {
            count: draft.duplicateCount,
          })}
        />
      )}
      {body}
    </div>
  );
}

