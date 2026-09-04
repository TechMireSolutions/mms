import type React from "react";
import { getDisplayName, type AppTranslationKey, type Contact } from "@mms/shared";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";
import {
  FormFooterBadge,
  FormFooterEntityChip,
  FormFooterErrorChip,
} from "@/components/ui/FormFooterChip";

type FormDraft = ReturnType<typeof useContactFormDraft>;

export interface ContactFormFooterStartProps {
  contactDraft: Partial<Contact>;
  collectionCounts: FormDraft["collectionCounts"];
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}

export function ContactFormFooterStart({
  contactDraft,
  collectionCounts,
  t,
}: ContactFormFooterStartProps): React.JSX.Element {
  if (!contactDraft.firstName?.trim()) {
    return (
      <FormFooterErrorChip>
        {t("contacts.form.firstNameRequired")}
      </FormFooterErrorChip>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <FormFooterEntityChip>{getDisplayName(contactDraft)}</FormFooterEntityChip>
      <div className="flex flex-wrap items-center gap-1.5">
        {collectionCounts.filledPhones > 0 && (
          <FormFooterBadge tone="primary">
            {collectionCounts.filledPhones} {t("contacts.form.tabPhones")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledEmails > 0 && (
          <FormFooterBadge tone="warning">
            {collectionCounts.filledEmails} {t("contacts.form.tabEmails")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledAddresses > 0 && (
          <FormFooterBadge tone="success">
            {collectionCounts.filledAddresses} {t("contacts.form.tabAddresses")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledSocials > 0 && (
          <FormFooterBadge tone="info">
            {collectionCounts.filledSocials} {t("contacts.form.tabSocials")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledEducation > 0 && (
          <FormFooterBadge tone="info">
            {collectionCounts.filledEducation} {t("contacts.form.tabEducation")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledExperience > 0 && (
          <FormFooterBadge tone="muted">
            {collectionCounts.filledExperience} {t("contacts.form.tabExperience")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledSkills > 0 && (
          <FormFooterBadge tone="success">
            {collectionCounts.filledSkills} {t("contacts.form.tabSkills")}
          </FormFooterBadge>
        )}
        {collectionCounts.filledRelationships > 0 && (
          <FormFooterBadge tone="destructive">
            {collectionCounts.filledRelationships} {t("contacts.detail.relationships")}
          </FormFooterBadge>
        )}
        {Boolean(collectionCounts.filledBankDetails && collectionCounts.filledBankDetails > 0) && (
          <FormFooterBadge tone="primary">
            {collectionCounts.filledBankDetails} {t("contacts.form.tabBankDetails")}
          </FormFooterBadge>
        )}
      </div>
    </div>
  );
}


