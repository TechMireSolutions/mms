import React, { useMemo } from "react";
import { IdCard } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { EditableMultiSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact, formatCnic, todayISO, getContactTags } from "@mms/shared";
import { cn } from "@/lib/utils";

export interface ContactBasicMetaFieldsProps {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  tags?: string[];
  onUpdateTags?: (tags: string[]) => void;
}

export function ContactBasicMetaFields({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  updateDraft,
  tags,
  onUpdateTags,
}: ContactBasicMetaFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const isSyedId = `cf-${formInstanceId}-isSyed`;
  const dobError = getFieldError("dob");
  const tagError = getFieldError("tag");

  const currentTags = useMemo(() => {
    return getContactTags(contactDraft);
  }, [contactDraft.tags, contactDraft.tag]);

  return (
    <>
      {isFieldEnabled("basic", "dob") && (
        <Field
          label={t("contacts.fields.dob")}
          required={isFieldRequired("basic", "dob")}
          error={dobError}
          id={`cf-${formInstanceId}-dob`}
        >
          <DatePicker
            id={`cf-${formInstanceId}-dob`}
            name="dob"
            autoComplete="bday"
            value={contactDraft.dob || undefined}
            onChange={(dateStr) => updateDraft({ dob: dateStr })}
            required={isFieldRequired("basic", "dob")}
            max={todayISO()}
            aria-invalid={Boolean(dobError)}
            className={cn(
              dobError &&
                "border-destructive focus-within:border-destructive focus-within:ring-destructive",
            )}
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
            icon={IdCard}
            id={`cf-${formInstanceId}-cnic`}
            name="cnic"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-invalid={Boolean(getFieldError("cnic"))}
            value={contactDraft.cnic || ""}
            onChange={(e) => {
              const formatted = formatCnic(e.target.value);
              updateDraft({ cnic: formatted });
            }}
            placeholder={t("contacts.form.cnicPlaceholder")}
          />
        </Field>
      )}

      {isFieldEnabled("basic", "tag") && (
        <Field
          label={t("contacts.fields.tag")}
          required={isFieldRequired("basic", "tag")}
          id={`cf-${formInstanceId}-tag`}
          error={tagError}
        >
          <EditableMultiSelect
            id={`cf-${formInstanceId}-tag`}
            options={tags ?? []}
            values={currentTags}
            onChange={(selected) =>
              updateDraft({
                tags: selected,
                tag: selected.join(", "),
              })
            }
            onUpdateOptions={onUpdateTags}
            placeholder={t("contacts.form.selectOption")}
            error={Boolean(tagError)}
            className="w-full"
          />
        </Field>
      )}

      {isFieldEnabled("basic", "isSyed") && (
        <div className="@md:col-span-2">
          <FormCheckboxCard
            id={isSyedId}
            name="isSyed"
            checked={Boolean(contactDraft.isSyed)}
            onCheckedChange={(checked) => updateDraft({ isSyed: checked })}
            label={t("contacts.fields.isSyed")}
            error={getFieldError("isSyed")}
          />
        </div>
      )}
    </>
  );
}

