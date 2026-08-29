import React, { useMemo } from "react";
import type { ChangeEvent } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field, FormCheckboxCard, EditableMultiSelect } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/hooks/useTranslation";
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

        {customBasicFields.length > 0 && (
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 pt-2 border-t border-border/50">
            {customBasicFields.map((field) => {
              const fieldId = `cf-${formInstanceId}-${field.key}`;
              const isReq = field.required ?? false;
              const err = getFieldError(field.key);
              const label = field.labelKey ? t(field.labelKey) : field.label;
              const rawVal = (contactDraft as Record<string, unknown>)[field.key];

              if (field.type === "boolean") {
                return (
                  <div key={field.key} className="@md:col-span-2">
                    <FormCheckboxCard
                      id={fieldId}
                      name={field.key}
                      checked={Boolean(rawVal)}
                      onCheckedChange={(checked) => updateDraft({ [field.key]: checked })}
                      label={label}
                      error={err}
                    />
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.key} className="@md:col-span-2">
                    <Field label={label} required={isReq} error={err} id={fieldId}>
                      <Textarea
                        id={fieldId}
                        name={field.key}
                        rows={2}
                        value={typeof rawVal === "string" ? rawVal : ""}
                        onChange={(e) => updateDraft({ [field.key]: e.target.value })}
                        placeholder={field.placeholder || label}
                        className={cn("text-xs resize-y min-h-16", err && "border-destructive focus-visible:ring-destructive")}
                      />
                    </Field>
                  </div>
                );
              }

              if (field.type === "date" || field.type === "datetime") {
                return (
                  <Field key={field.key} label={label} required={isReq} error={err} id={fieldId}>
                    <DatePicker
                      id={fieldId}
                      name={field.key}
                      value={typeof rawVal === "string" ? rawVal : undefined}
                      onChange={(val) => updateDraft({ [field.key]: val })}
                      aria-invalid={Boolean(err)}
                      className={cn(err && "border-destructive focus-within:border-destructive")}
                    />
                  </Field>
                );
              }

              if (field.type === "select" || field.type === "single_select") {
                const options = (field.options || []).map((opt) => ({ value: opt, label: opt }));
                return (
                  <Field key={field.key} label={label} required={isReq} error={err} id={fieldId}>
                    <FormSelect
                      id={fieldId}
                      options={options}
                      value={typeof rawVal === "string" ? rawVal : ""}
                      onChange={(val) => updateDraft({ [field.key]: val })}
                      placeholder={field.placeholder || t("contacts.form.selectOption")}
                      className="w-full"
                    />
                  </Field>
                );
              }

              if (field.type === "multiselect" || field.type === "multi_select" || field.type === "tags") {
                const currentVals = Array.isArray(rawVal)
                  ? (rawVal as string[])
                  : typeof rawVal === "string" && rawVal
                  ? rawVal.split(",").map((s) => s.trim())
                  : [];
                return (
                  <Field key={field.key} label={label} required={isReq} error={err} id={fieldId}>
                    <EditableMultiSelect
                      id={fieldId}
                      options={field.options || []}
                      values={currentVals}
                      onChange={(selected) => updateDraft({ [field.key]: selected })}
                      placeholder={field.placeholder || t("contacts.form.selectOption")}
                      error={Boolean(err)}
                      className="w-full"
                    />
                  </Field>
                );
              }

              return (
                <Field key={field.key} label={label} required={isReq} error={err} id={fieldId}>
                  <Input
                    id={fieldId}
                    name={field.key}
                    type={field.type === "number" || field.type === "currency" ? "number" : "text"}
                    aria-invalid={Boolean(err)}
                    value={typeof rawVal === "string" || typeof rawVal === "number" ? String(rawVal) : ""}
                    onChange={(e) => updateDraft({ [field.key]: e.target.value })}
                    placeholder={field.placeholder || label}
                    className={cn(err && "border-destructive focus-visible:ring-destructive")}
                  />
                </Field>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}




