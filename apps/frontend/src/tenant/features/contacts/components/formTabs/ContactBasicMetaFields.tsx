import React from "react";
import { FileText } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact, formatCnic } from "@mms/shared";

export function ContactBasicMetaFields({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  updateDraft,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const isSyedId = `cf-${formInstanceId}-isSyed`;

  return (
    <>
      {isFieldEnabled("basic", "dob") && (
        <Field
          label={t("contacts.fields.dob")}
          required={isFieldRequired("basic", "dob")}
          error={getFieldError("dob")}
          id={`cf-${formInstanceId}-dob`}
        >
          <DatePicker
            id={`cf-${formInstanceId}-dob`}
            name="dob"
            value={contactDraft.dob || undefined}
            onChange={(dateStr) => updateDraft({ dob: dateStr })}
            required={isFieldRequired("basic", "dob")}
          />
        </Field>
      )}

      {isFieldEnabled("basic", "cnic") && (
        <Field
          label={t("contacts.form.cnic")}
          required={isFieldRequired("basic", "cnic")}
          id={`cf-${formInstanceId}-cnic`}
          error={getFieldError("cnic")}
        >
          <LeadingIconInput
            icon={FileText}
            id={`cf-${formInstanceId}-cnic`}
            name="cnic"
            value={contactDraft.cnic || ""}
            onChange={(e) => {
              const formatted = formatCnic(e.target.value);
              updateDraft({ cnic: formatted });
            }}
            placeholder={t("contacts.form.cnicPlaceholder")}
          />
        </Field>
      )}

      {isFieldEnabled("basic", "isSyed") && (
        <FormCheckboxCard
          id={isSyedId}
          name="isSyed"
          checked={Boolean(contactDraft.isSyed)}
          onCheckedChange={(checked) => updateDraft({ isSyed: checked })}
          label={t("contacts.fields.isSyed")}
          error={getFieldError("isSyed")}
        />
      )}
    </>
  );
}

