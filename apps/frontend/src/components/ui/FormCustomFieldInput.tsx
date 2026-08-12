import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { RegistryDateField } from "@/components/ui/RegistryDateField";
import { Textarea } from "@/components/ui/textarea";
import { FormCustomFieldFileInput } from "@/components/ui/FormCustomFieldFileInput";
import { TagsInput } from "@/components/ui/FormTagsInput";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import type { FieldDefinition, CustomFieldConfig as SharedCustomFieldConfig } from "@mms/shared";
import {
  CustomFieldAiSummaryInput,
  CustomFieldLocationInput,
  CustomFieldRatingInput,
} from "./formCustomFieldSpecialInputs";

export type CustomFieldConfig = SharedCustomFieldConfig;

interface CustomFieldInputProps {
  field: FieldDefinition | SharedCustomFieldConfig;
  value: unknown;
  onChange: (fieldValue: unknown) => void;
  disabled?: boolean;
  error?: boolean;
}

export function CustomFieldInput({ field, value, onChange, disabled = false, error = false }: CustomFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const displayValue = value ?? "";

  const getOptionsArray = (options: string | string[] | null | undefined): string[] => {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      return options.split(",").map((option) => option.trim()).filter(Boolean);
    }
    return [];
  };

  if (field.type === "tags" || field.type === "multiselect" || field.type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const predefined = getOptionsArray(field.options);
    return <TagsInput id={field.key} name={field.key} selected={selected} predefined={predefined} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.key}
        name={field.key}
        className={cn("resize-none h-20", error && "border-destructive focus-visible:ring-destructive")}
        value={String(displayValue)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder || ""}
        disabled={disabled}
      />
    );
  }

  if (field.type === "select" || field.type === "single_select") {
    return (
      <FormSelect
        id={field.key}
        name={field.key}
        value={String(displayValue)}
        onChange={(val) => onChange(val)}
        options={getOptionsArray(field.options)}
        placeholder={t("contacts.form.selectOption")}
        disabled={disabled}
        className={error ? "border-destructive focus:border-destructive" : ""}
      />
    );
  }

  if (field.type === "boolean") {
    const isChecked = !!value;
    return (
      <div className="flex h-11 items-center gap-2 pt-1">
        <Checkbox
          id={field.key}
          checked={isChecked}
          onCheckedChange={(isCheckedVal) => !disabled && onChange(!!isCheckedVal)}
          disabled={disabled}
          aria-label={t("contacts.form.toggleOption", { field: field.key })}
        />
        <span className="text-sm text-muted-foreground">{isChecked ? t("common.yes") : t("common.no")}</span>
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <FormCustomFieldFileInput
        field={field}
        value={value}
        onChange={onChange}
        uploadInstructions={t("contacts.form.uploadAvatarInstructions")}
        clickToUploadDocumentLabel={t("contacts.form.clickToUploadDocument")}
        removePhotoLabel={t("contacts.form.removePhoto")}
      />
    );
  }

  if (field.type === "location") {
    return <CustomFieldLocationInput field={field} value={value} displayValue={displayValue} onChange={onChange} />;
  }

  if (field.type === "ai_summary") {
    return <CustomFieldAiSummaryInput field={field} value={value} displayValue={displayValue} onChange={onChange} />;
  }

  if (field.key === "rating") {
    return <CustomFieldRatingInput displayValue={displayValue} onChange={onChange} />;
  }

  if (field.type === "datetime") {
    return (
      <DateTimePicker
        id={field.key}
        name={field.key}
        value={displayValue ? String(displayValue) : null}
        onChange={(nextValue) => onChange(nextValue)}
        required={field.required}
        disabled={disabled}
        error={error}
      />
    );
  }

  if (field.type === "currency") {
    return (
      <div className="relative">
        <Input
          id={field.key}
          name={field.key}
          type="text"
          value={String(displayValue)}
          onChange={(event) => {
            const inputValue = event.target.value;
            if (inputValue === "" || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
              onChange(inputValue);
            }
          }}
          placeholder={field.placeholder || "0.00"}
          disabled={disabled}
          readOnly={disabled}
          className={cn("ps-7", error ? "border-destructive focus-visible:ring-destructive" : "")}
        />
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground text-sm font-semibold">
          {activeCurrency.symbol || "₨"}
        </div>
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <RegistryDateField
        id={field.key}
        name={field.key}
        value={String(displayValue)}
        onChange={(dateVal) => onChange(dateVal)}
        required={field.required}
        disabled={disabled}
        className={error ? "border-destructive focus-within:border-destructive focus-within:ring-destructive" : ""}
      />
    );
  }

  const getInputType = (type: string) => {
    switch (type) {
      case "number":
        return "number";
      case "phone":
        return "tel";
      case "email":
        return "email";
      case "url":
        return "url";
      default:
        return "text";
    }
  };

  return (
    <Input
      id={field.key}
      name={field.key}
      type={getInputType(field.type)}
      value={String(displayValue)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.mask || field.placeholder || ""}
      disabled={disabled}
      readOnly={disabled}
      aria-invalid={error}
      aria-required={field.required}
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  );
}
