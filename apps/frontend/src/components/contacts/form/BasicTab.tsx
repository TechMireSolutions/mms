import React from "react";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { Field, CustomFieldInput } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";
import useTranslation from "@/hooks/useTranslation";

interface ContactFormData {
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string | null;
  gender?: string;
  dob?: string;
  isSyed?: boolean;
  [key: string]: unknown;
}

interface BasicTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  tabId?: string;
}

/**
 * BasicTab component for editing basic contact information dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function BasicTab({ data, onChange, tabId = "basic" }: BasicTabProps): React.JSX.Element {
  const { isTabFieldEnabled, isTabFieldRequired } = useContactConfig();
  const { t } = useTranslation();
  const sortedFields = useSortedFields(tabId);

  const upd = (f: string, v: unknown): void => {
    const updated = { ...data, [f]: v };
    if (f === "firstName" || f === "lastName") {
      const first = f === "firstName" ? String(v) : (data.firstName || "");
      const last = f === "lastName" ? String(v) : (data.lastName || "");
      updated.name = [first, last].filter(Boolean).join(" ");
    }
    onChange(updated);
  };

  const enabledFields = sortedFields.filter((f) => isTabFieldEnabled(tabId, f.key));

  return (
    <div className="space-y-5">
      {enabledFields.map((field) => {
        const label = field.label as string;
        const required = isTabFieldRequired(tabId, field.key);
        return (
          <Field key={field.key} label={label} required={required}>
            <CustomFieldInput
              field={field}
              value={data[field.key]}
              onChange={(val) => upd(field.key, val)}
            />
          </Field>
        );
      })}

      {enabledFields.length === 0 && (
        <p
          className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl bg-card"
        >
          {t("contacts.form.noOptionalFields")}
        </p>
      )}
    </div>
  );
}
