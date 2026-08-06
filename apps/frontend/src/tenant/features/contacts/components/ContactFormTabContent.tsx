import { ContactBasicTab } from "@/tenant/features/contacts/components/formTabs/ContactBasicTab";
import { ContactPhonesTab } from "@/tenant/features/contacts/components/formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "@/tenant/features/contacts/components/formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "@/tenant/features/contacts/components/formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "@/tenant/features/contacts/components/formTabs/ContactSocialsTab";
import { ContactRelationshipTab } from "@/tenant/features/contacts/components/formTabs/ContactRelationshipTab";
import { ContactCustomFieldsTab } from "@/tenant/features/contacts/components/formTabs/ContactCustomFieldsTab";
import { ContactCustomCollectionTab } from "@/tenant/features/contacts/components/formTabs/ContactCustomCollectionTab";
import type { ContactSubListTabBaseProps } from "@/tenant/features/contacts/components/formTabs/types";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import { normalizeContactFormTabId } from "@mms/shared";

export { ContactFormFooterStart } from "@/tenant/features/contacts/components/ContactFormFooterStart";

type FormDraft = ReturnType<typeof useContactFormDraft>;

function subListBaseProps(draft: FormDraft): ContactSubListTabBaseProps {
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

export function ContactFormTabContent({
  tab,
  draft,
  lockGender,
  defaultCountry,
  defaultCity,
  defaultProvince,
}: {
  tab: string;
  draft: FormDraft;
  lockGender: boolean;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
}): JSX.Element | null {
  const listBase = subListBaseProps(draft);

  switch (normalizeContactFormTabId(tab)) {
    case "basic":
      return (
        <ContactBasicTab
          contactDraft={draft.contactDraft}
          formInstanceId={draft.formInstanceId}
          fields={draft.fields}
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
        />
      );
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
    case "relationship":
      return (
        <ContactRelationshipTab
          {...listBase}
          relationshipOptions={draft.relationshipOptions}
          onUpdateRelationships={draft.updateRelationships}
        />
      );
    case "custom":
      return (
        <ContactCustomFieldsTab
          contactDraft={draft.contactDraft}
          formInstanceId={draft.formInstanceId}
          fields={draft.fields}
          tabId="custom"
          getFieldError={draft.getFieldError}
          updateDraft={draft.updateDraft}
        />
      );
    default:
      return (
        <ContactCustomCollectionTab
          contactDraft={draft.contactDraft}
          formInstanceId={draft.formInstanceId}
          fields={draft.fields}
          tabId={tab}
          getLocalId={draft.getLocalId}
          getListItemError={draft.getListItemError}
          updateDraft={draft.updateDraft}
        />
      );
  }
}
