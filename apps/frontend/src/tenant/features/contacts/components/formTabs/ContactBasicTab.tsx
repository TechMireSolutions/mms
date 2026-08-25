import React, { useMemo } from "react";
import type { ChangeEvent } from "react";
import { SectionCard } from "@/components/ui/SectionCard";

import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { listEnabledCustomContactFormFields, type Contact, type FieldDefinition } from "@mms/shared";
import { ContactBasicAvatarSection } from "@/tenant/features/contacts/components/formTabs/ContactBasicAvatarSection";
import { ContactBasicIdentityFields } from "@/tenant/features/contacts/components/formTabs/ContactBasicIdentityFields";

export interface ContactBasicTabProps {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  cropSrc: string | null;
  setCropSrc: (src: string | null) => void;
  genders: string[];
  onUpdateGenders: (genders: string[]) => void;
  tags?: string[];
  onUpdateTags?: (tags: string[]) => void;
  lockGender: boolean;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fields?: Record<string, FieldDefinition[]>;
}

/**
 * Basic Info form tab: coordinates avatar photo upload/cropping, core personal identity fields,
 * and dynamic custom fields configured under the basic tab.
 */
export function ContactBasicTab({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  updateDraft,
  cropSrc,
  setCropSrc,
  genders,
  onUpdateGenders,
  tags,
  onUpdateTags,
  lockGender,
  handleAvatarChange,
  fields,
}: ContactBasicTabProps): React.JSX.Element {
  const { t } = useTranslation();

  const customBasicFields = useMemo(() => {
    if (!fields) return [];
    return listEnabledCustomContactFormFields(fields, "basic");
  }, [fields]);

  return (
    <SectionCard accentColor="primary" className="text-start">
      <div className="space-y-5">
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
          tags={tags}
          onUpdateTags={onUpdateTags}
          lockGender={lockGender}
        />


      </div>
    </SectionCard>
  );
}




