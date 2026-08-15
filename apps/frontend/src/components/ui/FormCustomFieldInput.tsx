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
import type { FieldDefinition } from "@mms/shared";
import {
  CustomFieldAiSummaryInput,
  CustomFieldLocationInput,
  CustomFieldRatingInput,
} from "./formCustomFieldSpecialInputs";

export type CustomFieldConfig = FieldDefinition;

interface CustomFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldValue: unknown) => void;
  disabled?: boolean;
  error?: boolean;
}

function getOptionsArray(options: unknown): string[] {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    return options.split(",").map((option) => option.trim()).filter(Boolean);
  }
  return [];
}

function getInputType(type: string): string {
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
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  disabled = false,
  error = false,
}: CustomFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const displayValue = value ?? "";

  if (field.type === "tags" || field.type === "multiselect" || field.type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const predefined = getOptionsArray(field.options);
    return (
      <TagsInput
        id={field.key}
        name={field.key}
        selected={selected}
        predefined={predefined}
        onChange={onChange}
      />
    );
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
        aria-invalid={error}
        aria-required={Boolean(field.required)}
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
        placeholder={field.placeholder || t("common.selectOption")}
        disabled={disabled}
        aria-invalid={error}
        aria-required={Boolean(field.required)}
        className={error ? "border-destructive focus:border-destructive" : ""}
      />
    );
  }

  if (field.type === "boolean") {
    const isChecked = Boolean(value);
    return (
      <div className="flex h-11 items-center gap-2 pt-1">
        <Checkbox
          id={field.key}
          checked={isChecked}
          onCheckedChange={(isCheckedVal) => !disabled && onChange(Boolean(isCheckedVal))}
          disabled={disabled}
          aria-label={field.label || field.key}
        />
        <span className="text-sm text-muted-foreground">
          {isChecked ? t("common.yes") : t("common.no")}
        </span>
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
    return (
      <CustomFieldLocationInput
        field={field}
        value={value}
        displayValue={displayValue}
        onChange={onChange}
      />
    );
  }

  if (field.type === "ai_summary") {
    return (
      <CustomFieldAiSummaryInput
        field={field}
        value={value}
        displayValue={displayValue}
        onChange={onChange}
      />
    );
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
        required={Boolean(field.required)}
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
          inputMode="decimal"
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
          aria-invalid={error}
          aria-required={Boolean(field.required)}
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
        required={Boolean(field.required)}
        disabled={disabled}
        className={
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive"
            : ""
        }
      />
    );
  }

  return (
    <Input
      id={field.key}
      name={field.key}
      type={getInputType(field.type)}
      step={field.type === "number" ? "any" : undefined}
      value={String(displayValue)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.mask || field.placeholder || ""}
      disabled={disabled}
      readOnly={disabled}
      aria-invalid={error}
      aria-required={Boolean(field.required)}
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  );
}
