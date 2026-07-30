import type React from "react";
import { BrainCircuit, MapPin, Star } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormCustomFieldFileInput } from "@/components/ui/FormCustomFieldFileInput";
import { TagsInput } from "@/components/ui/FormTagsInput";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import type { FieldDefinition } from "@mms/shared";

export type CustomFieldConfig = FieldDefinition;

interface CustomFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldValue: unknown) => void;
  disabled?: boolean;
  error?: boolean;
}

export function CustomFieldInput({ field, value, onChange, disabled = false, error = false }: CustomFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const displayValue = value ?? "";

  const getOptionsArray = (options: string | string[] | undefined): string[] => {
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
    const loc = (value as { lat: number; lng: number; address?: string }) || { lat: 24.8607, lng: 67.0011 };
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            id={`${field.key}-lat`}
            name={`${field.key}-lat`}
            type="number"
            step="any"
            placeholder={t("contacts.form.latitude")}
            value={loc.lat}
            onChange={(event) => onChange({ ...loc, lat: parseFloat(event.target.value) })}
          />
          <Input
            id={`${field.key}-lng`}
            name={`${field.key}-lng`}
            type="number"
            step="any"
            placeholder={t("contacts.form.longitude")}
            value={loc.lng}
            onChange={(event) => onChange({ ...loc, lng: parseFloat(event.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-bold">
          <MapPin className="w-3 h-3" />
          <span>{t("contacts.form.locationSetTo", { lat: loc.lat.toFixed(4), lng: loc.lng.toFixed(4) })}</span>
        </div>
      </div>
    );
  }

  if (field.type === "ai_summary") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded w-fit">
          <BrainCircuit className="w-3 h-3" /> {t("contacts.form.aiInsights")}
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground italic leading-relaxed">
          {String(displayValue) || t("contacts.form.aiSummaryPlaceholder")}
        </div>
      </div>
    );
  }

  if (field.key === "rating") {
    const currentRating = Number(displayValue || 0);
    return (
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          return (
            <Button
              key={index}
              type="button"
              variant="ghost"
              onClick={() => onChange(starValue)}
              className={`w-11 h-11 p-0 flex items-center justify-center transition-all hover:scale-125 hover:bg-transparent ${
                starValue <= currentRating ? "text-primary hover:text-primary" : "text-muted-foreground/30 hover:text-muted-foreground/40"
              }`}
            >
              <Star className={`w-5 h-5 ${starValue <= currentRating ? "fill-primary" : "fill-transparent"}`} />
            </Button>
          );
        })}
        {currentRating > 0 && (
          <span className="text-xs text-muted-foreground ms-2 font-medium">
            {currentRating} {t("contacts.form.outOf5Stars")}
          </span>
        )}
      </div>
    );
  }

  if (field.type === "datetime") {
    let formattedVal = "";
    if (displayValue) {
      try {
        const parsedDate = new Date(String(displayValue));
        if (!isNaN(parsedDate.getTime())) {
          formattedVal = parsedDate.toISOString().slice(0, 16);
        }
      } catch {
        formattedVal = String(displayValue);
      }
    }
    return (
      <Input
        id={field.key}
        name={field.key}
        type="datetime-local"
        value={formattedVal}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
        disabled={disabled}
        readOnly={disabled}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
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
      <DatePicker
        id={field.key}
        name={field.key}
        value={String(displayValue)}
        onChange={(dateVal) => onChange(dateVal)}
        disabled={disabled}
        className={error ? "border-destructive focus-within:border-destructive focus-within:ring-destructive" : ""}
      />
    );
  }

  const inputType = field.type === "number" ? "number" : "text";
  return (
    <Input
      id={field.key}
      name={field.key}
      type={inputType}
      value={String(displayValue)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.mask || field.placeholder || ""}
      disabled={disabled}
      readOnly={disabled}
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  );
}
