import React from "react";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { Contact } from "@mms/shared";
import { ContactBasicMetaFields } from "@/tenant/features/contacts/components/formTabs/ContactBasicMetaFields";
import { GenderIcon } from "@/components/ui/GenderIcon";

export function ContactBasicIdentityFields({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  updateDraft,
  genders,
  onUpdateGenders,
  lockGender,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  genders: string[];
  onUpdateGenders: (genders: string[]) => void;
  lockGender: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
        {isFieldEnabled("basic", "firstName") && (
          <Field
            label={t("contacts.fields.firstName")}
            required={isFieldRequired("basic", "firstName")}
            error={getFieldError("firstName")}
            id={`cf-${formInstanceId}-firstName`}
          >
            <div className="relative flex items-center group/input">
              <User className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id={`cf-${formInstanceId}-firstName`}
                name="firstName"
                value={contactDraft.firstName || ""}
                onChange={(e) => updateDraft({ firstName: e.target.value })}
                placeholder={t("contacts.fields.firstName")}
                className="ps-10"
              />
            </div>
          </Field>
        )}

        {isFieldEnabled("basic", "lastName") && (
          <Field
            label={t("contacts.fields.lastName")}
            required={isFieldRequired("basic", "lastName")}
            error={getFieldError("lastName")}
            id={`cf-${formInstanceId}-lastName`}
          >
            <div className="relative flex items-center group/input">
              <User className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id={`cf-${formInstanceId}-lastName`}
                name="lastName"
                value={contactDraft.lastName || ""}
                onChange={(e) => updateDraft({ lastName: e.target.value })}
                placeholder={t("contacts.fields.lastName")}
                className="ps-10"
              />
            </div>
          </Field>
        )}

        {isFieldEnabled("basic", "gender") && (
          <Field
            label={t("contacts.fields.gender")}
            required={isFieldRequired("basic", "gender")}
            error={getFieldError("gender")}
            id={`cf-${formInstanceId}-gender`}
          >
            {lockGender ? (
              <div className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground select-none font-semibold">
                {contactDraft.gender ? (
                  <>
                    <GenderIcon gender={contactDraft.gender} className="w-3.5 h-3.5" />
                    {formatContactGenderLabel(contactDraft.gender, t)}
                  </>
                ) : (
                  t("contacts.gender.unspecified")
                )}
              </div>
            ) : (
              <EditableSelect
                id={`cf-${formInstanceId}-gender`}
                options={genders}
                value={
                  genders.find(
                    (option) => option.toLowerCase() === (contactDraft.gender || "").toLowerCase(),
                  ) ||
                  contactDraft.gender ||
                  ""
                }
                onChange={(val) => updateDraft({ gender: val.toLowerCase() })}
                onUpdateOptions={onUpdateGenders}
                placeholder={t("contacts.form.selectOption")}
                className="w-full"
              />
            )}
          </Field>
        )}

        <ContactBasicMetaFields
          contactDraft={contactDraft}
          formInstanceId={formInstanceId}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          updateDraft={updateDraft}
        />
      </div>
    </>
  );
}
