import type React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { listEnabledCustomFacultyFormFields, type FieldDefinition, type Teacher } from "@mms/shared";

interface FacultyCustomFieldsSectionProps {
  fields: Record<string, FieldDefinition[]>;
  draft: Partial<Teacher>;
  errors: Record<string, string>;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function FacultyCustomFieldsSection({ fields, draft, errors, onDraftChange }: FacultyCustomFieldsSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listEnabledCustomFacultyFormFields(fields);
  if (customFields.length === 0) return null;
  const values = draft as Record<string, unknown>;
  const change = (key: string, value: unknown) => onDraftChange({ [key]: value } as Partial<Teacher>);

  return (
    <SectionCard title={t("teachers.form.sectionCustom")} icon={SlidersHorizontal} accentColor="primary">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {customFields.map((field) => {
          const value = values[field.key];
          const error = errors[field.key] || errors[`custom:${field.key}`];
          const common = { id: field.key, name: field.key };
          return (
            <Field key={field.key} label={field.label} id={field.key} required={Boolean(field.required)} error={error}>
              {field.type === "textarea" ? (
                <Textarea {...common} value={String(value ?? "")} onChange={(event) => change(field.key, event.target.value)} aria-invalid={Boolean(error)} />
              ) : field.type === "date" ? (
                <DatePicker {...common} value={typeof value === "string" ? value : undefined} onChange={(next) => change(field.key, next)} />
              ) : field.type === "select" || field.type === "single_select" ? (
                <FormSelect {...common} value={String(value ?? "")} onChange={(next) => change(field.key, next)} options={(field.options ?? []).map((option) => ({ value: String(option), label: String(option) }))} />
              ) : field.type === "multi_select" || field.type === "multiselect" ? (
                <div className="space-y-1 rounded-md border border-border p-2">
                  {(field.options ?? []).map((option) => {
                    const optionValue = String(option);
                    const selected = Array.isArray(value) ? value.map(String) : [];
                    return <label key={optionValue} className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 hover:bg-muted/50"><Checkbox checked={selected.includes(optionValue)} onCheckedChange={(checked) => change(field.key, checked ? [...selected, optionValue] : selected.filter((item) => item !== optionValue))} /><span className="text-sm">{optionValue}</span></label>;
                  })}
                </div>
              ) : field.type === "boolean" ? (
                <div className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3">
                  <Checkbox {...common} checked={Boolean(value)} onCheckedChange={(next) => change(field.key, Boolean(next))} />
                  <label htmlFor={field.key} className="cursor-pointer text-sm">{field.label}</label>
                </div>
              ) : (
                <Input {...common} type={field.type === "number" || field.type === "currency" ? "number" : field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "datetime" ? "datetime-local" : "text"} value={String(value ?? "")} onChange={(event) => change(field.key, (field.type === "number" || field.type === "currency") && event.target.value !== "" ? Number(event.target.value) : event.target.value)} aria-invalid={Boolean(error)} />
              )}
            </Field>
          );
        })}
      </div>
    </SectionCard>
  );
}
