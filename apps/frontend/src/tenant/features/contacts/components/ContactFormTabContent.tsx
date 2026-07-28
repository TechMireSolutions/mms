import { getDisplayName, type AppTranslationKey, type Contact } from "@mms/shared";
import { ContactBasicTab } from "@/tenant/features/contacts/components/formTabs/ContactBasicTab";
import { ContactPhonesTab } from "@/tenant/features/contacts/components/formTabs/ContactPhonesTab";
import { ContactEmailsTab } from "@/tenant/features/contacts/components/formTabs/ContactEmailsTab";
import { ContactAddressesTab } from "@/tenant/features/contacts/components/formTabs/ContactAddressesTab";
import { ContactSocialsTab } from "@/tenant/features/contacts/components/formTabs/ContactSocialsTab";
import { ContactEmergencyTab } from "@/tenant/features/contacts/components/formTabs/ContactEmergencyTab";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";

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

export function ContactFormFooterStart({
  contactDraft,
  collectionCounts,
  t,
}: {
  contactDraft: Partial<Contact>;
  collectionCounts: FormDraft["collectionCounts"];
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}): JSX.Element {
  if (!contactDraft.firstName) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
        {t("contacts.form.firstNameRequired")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {getDisplayName(contactDraft)}
      </span>
      <div className="flex items-center gap-1.5">
        {collectionCounts.filledPhones > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
            {collectionCounts.filledPhones} {t("contacts.form.phonesLabel")}
          </span>
        )}
        {collectionCounts.filledEmails > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-warning/10 text-warning font-semibold border border-warning/20 text-[10px]">
            {collectionCounts.filledEmails} {t("contacts.form.emailsLabel")}
          </span>
        )}
        {collectionCounts.filledEmergency > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20 text-[10px]">
            {collectionCounts.filledEmergency} {t("contacts.detail.emergency")}
          </span>
        )}
      </div>
    </div>
  );
}
