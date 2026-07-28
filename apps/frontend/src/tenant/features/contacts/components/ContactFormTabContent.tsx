import { ContactBasicTab } from "@/tenant/features/contacts/components/formTabs/ContactBasicTab";
import { ContactPhonesTab } from "@/tenant/features/contacts/components/formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "@/tenant/features/contacts/components/formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "@/tenant/features/contacts/components/formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "@/tenant/features/contacts/components/formTabs/ContactSocialsTab";
import { ContactEmergencyTab } from "@/tenant/features/contacts/components/formTabs/ContactEmergencyTab";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";

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
  switch (tab) {
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
          defaultCountryCode={draft.defaultCountryCode}
          countryCodeOptions={draft.countryCodeOptions}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
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
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
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
          defaultCity={defaultCity}
          defaultProvince={defaultProvince}
          defaultCountry={defaultCountry}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
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
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    case "emergency":
      return (
        <ContactEmergencyTab
          contactDraft={draft.contactDraft}
          getLocalId={draft.getLocalId}
          relationshipOptions={draft.relationshipOptions}
          getListItemError={draft.getListItemError}
          addSubListItem={draft.addSubListItem}
          updateSubListItem={draft.updateSubListItem}
          removeSubListItem={draft.removeSubListItem}
        />
      );
    default:
      return null;
  }
}
