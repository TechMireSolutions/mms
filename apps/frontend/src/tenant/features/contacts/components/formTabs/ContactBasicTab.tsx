import React, { useMemo } from "react";
import type { ChangeEvent } from "react";
import { User } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
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
    <div className="space-y-4 text-start">
      <SectionCard title={t("contacts.tabs.basic")} icon={User} accentColor="primary">
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

        {customBasicFields.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("contacts.form.additionalInfo")}
            </h4>
            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
              {customBasicFields.map((field) => {
                const error = getFieldError(field.key);
                const required = isFieldRequired("basic", field.key);
                const label = resolveRegistryLabel(field, t);
                const value = (contactDraft as Record<string, unknown>)[field.key];
                return (
                  <Field
                    key={field.key}
                    label={label}
                    required={required}
                    error={error}
                    id={`cf-${formInstanceId}-${field.key}`}
                  >
                    <CustomFieldInput
                      field={field}
                      value={value}
                      onChange={(val) => updateDraft({ [field.key]: val })}
                      error={Boolean(error)}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}




