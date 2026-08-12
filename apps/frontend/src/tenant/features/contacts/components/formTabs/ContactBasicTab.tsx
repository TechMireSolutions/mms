import React, { ChangeEvent } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { Contact, CustomFieldConfig } from "@mms/shared";
import { ContactBasicAvatarSection } from "@/tenant/features/contacts/components/formTabs/ContactBasicAvatarSection";
import { ContactBasicIdentityFields } from "@/tenant/features/contacts/components/formTabs/ContactBasicIdentityFields";
import { ContactCustomFieldsTab } from "@/tenant/features/contacts/components/formTabs/ContactCustomFieldsTab";

interface ContactBasicTabProps {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  customFields?: CustomFieldConfig[];
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  cropSrc: string | null;
  setCropSrc: (src: string | null) => void;
  genders: string[];
  onUpdateGenders: (genders: string[]) => void;
  lockGender: boolean;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ContactBasicTab({
  contactDraft,
  formInstanceId,
  customFields,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  updateDraft,
  cropSrc,
  setCropSrc,
  genders,
  onUpdateGenders,
  lockGender,
  handleAvatarChange,
}: ContactBasicTabProps): JSX.Element {
  return (
    <div className="space-y-4 text-start">
      <SectionCard accentColor="primary">
        {isFieldEnabled("basic", "avatar") && (
          <ContactBasicAvatarSection
            contactDraft={contactDraft}
            formInstanceId={formInstanceId}
            cropSrc={cropSrc}
            setCropSrc={setCropSrc}
            updateDraft={updateDraft}
            handleAvatarChange={handleAvatarChange}
          />
        )}

        <ContactBasicIdentityFields
          contactDraft={contactDraft}
          formInstanceId={formInstanceId}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          updateDraft={updateDraft}
          genders={genders}
          onUpdateGenders={onUpdateGenders}
          lockGender={lockGender}
        />

        <ContactCustomFieldsTab
          contactDraft={contactDraft}
          formInstanceId={formInstanceId}
          customFields={customFields}
          getFieldError={getFieldError}
          updateDraft={updateDraft}
          tabId="basic"
          hideWhenEmpty
          className="mt-4"
        />
      </SectionCard>
    </div>
  );
}

