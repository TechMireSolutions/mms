import { ContactBasicTab } from "@/tenant/features/contacts/components/formTabs/ContactBasicTab";
import { ContactPhonesTab } from "@/tenant/features/contacts/components/formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "@/tenant/features/contacts/components/formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "@/tenant/features/contacts/components/formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "@/tenant/features/contacts/components/formTabs/ContactSocialsTab";
import { ContactRelationshipTab } from "@/tenant/features/contacts/components/formTabs/ContactRelationshipTab";
import { ContactCustomFieldsTab } from "@/tenant/features/contacts/components/formTabs/ContactCustomFieldsTab";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import { normalizeContactFormTabId } from "@mms/shared";

export { ContactFormFooterStart } from "@/tenant/features/contacts/components/ContactFormFooterStart";

type FormDraft = ReturnType<typeof useContactFormDraft>;

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
  switch (normalizeContactFormTabId(tab)) {
    case "basic":
      return (
        <ContactBasicTab
          contactDraft={draft.contactDraft}
          formInstanceId={String(draft.formInstanceId)}
          isFieldEnabled={draft.isFieldEnabled}
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
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          phoneLabels={draft.phoneLabels}
          onUpdatePhoneLabels={draft.updatePhoneLabels}
          defaultCountryCode={draft.defaultCountryCode}
          countryCodeOptions={draft.countryCodeOptions}
          onUpdateDialCodeOptions={draft.updateDialCodeOptions}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          ensureSubListItem={draft.ensureSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
          handlePhoneBlur={draft.handlePhoneBlur}
        />
      );
    case "emails":
      return (
        <ContactEmailsTab
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          emailLabels={draft.emailLabels}
          onUpdateEmailLabels={draft.updateEmailLabels}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          ensureSubListItem={draft.ensureSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    case "addresses":
      return (
        <ContactAddressesTab
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          addressLabels={draft.addressLabels}
          onUpdateAddressLabels={draft.updateAddressLabels}
          countryOptions={draft.countryOptions}
          onUpdateCountryOptions={draft.updateCountryOptions}
          defaultCity={defaultCity}
          defaultProvince={defaultProvince}
          defaultCountry={defaultCountry}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          ensureSubListItem={draft.ensureSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    case "socials":
      return (
        <ContactSocialsTab
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          socialPlatforms={draft.socialPlatforms}
          onUpdateSocialPlatforms={draft.updateSocialPlatforms}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          ensureSubListItem={draft.ensureSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    case "relationship":
      return (
        <ContactRelationshipTab
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          relationshipOptions={draft.relationshipOptions}
          onUpdateRelationships={draft.updateRelationships}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          ensureSubListItem={draft.ensureSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    case "custom":
      return (
        <ContactCustomFieldsTab
          contactDraft={draft.contactDraft}
          formInstanceId={String(draft.formInstanceId)}
          fields={draft.fields}
          getFieldError={draft.getFieldError}
          updateDraft={draft.updateDraft}
        />
      );
    default:
      return null;
  }
}
