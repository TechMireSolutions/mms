import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { type ModuleFieldDef } from "@mms/shared";

interface DistributeModalCustomFieldProps {
  field: ModuleFieldDef;
  fieldValue: unknown;
  updateField: (field: string, value: unknown) => void;
  getCustomFieldPlaceholder: (fieldLabel: string) => string;
}

export function DistributeModalCustomField({
  field,
  fieldValue,
  updateField,
  getCustomFieldPlaceholder,
}: DistributeModalCustomFieldProps) {
  const { t } = useTranslation();

  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label className={FORM_LABEL}>{field.label} {field.required ? "*" : ""}</label>
      {field.type === "textarea" ? (
        <Textarea
          id={`custom-${field.id}`}
          name={field.id}
          value={String(fieldValue)}
          onChange={(event) => updateField(field.id, event.target.value)}
          placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
          required={field.required}
        />
      ) : field.type === "select" ? (
        <FormSelect
          value={String(fieldValue)}
          onChange={(value) => updateField(field.id, value)}
          placeholder={t("hasanat.form.selectOption")}
          options={field.options || []}
        />
      ) : field.type === "boolean" ? (
        <label className="flex cursor-pointer select-none items-center gap-2.5 py-2">
          <Checkbox checked={!!fieldValue} onCheckedChange={(checked) => updateField(field.id, !!checked)} />
          <span className="text-xs font-medium text-foreground">{field.label}</span>
        </label>
      ) : field.type === "number" ? (
        <Input
          type="number"
          className={FORM_INPUT}
          value={typeof fieldValue === "number" ? fieldValue : String(fieldValue)}
          onChange={(event) => updateField(field.id, event.target.value)}
          placeholder={field.placeholder || t("hasanat.form.enterNumber")}
          required={field.required}
        />
      ) : field.type === "date" ? (
        <DatePicker value={String(fieldValue)} onChange={(value) => updateField(field.id, value)} required={field.required} />
      ) : (
        <Input
          type="text"
          className={FORM_INPUT}
          value={String(fieldValue)}
          onChange={(event) => updateField(field.id, event.target.value)}
          placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
          required={field.required}
        />
      )}
    </div>
  );
}
