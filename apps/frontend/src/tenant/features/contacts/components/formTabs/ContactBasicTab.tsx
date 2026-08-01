import React, { ChangeEvent } from "react";
import { User } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { Contact } from "@mms/shared";
import { ContactBasicAvatarSection } from "@/tenant/features/contacts/components/formTabs/ContactBasicAvatarSection";
import { ContactBasicIdentityFields } from "@/tenant/features/contacts/components/formTabs/ContactBasicIdentityFields";

export interface ContactBasicTabProps {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
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
  isFieldEnabled,
  getFieldError,
  updateDraft,
  cropSrc,
  setCropSrc,
  genders,
  onUpdateGenders,
  lockGender,
  handleAvatarChange,
}: ContactBasicTabProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <SectionCard
        title={t("contacts.form.tabBasic")}
        icon={User}
        accentColor="primary"
      >
        {isFieldEnabled("basic", "avatar") && (
          <ContactBasicAvatarSection
            contactDraft={contactDraft}
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
          getFieldError={getFieldError}
          updateDraft={updateDraft}
          genders={genders}
          onUpdateGenders={onUpdateGenders}
          lockGender={lockGender}
        />
      </SectionCard>
    </div>
  );
}
