import { useState, useMemo, useCallback } from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FieldDefinition, getDefaultFieldValue, ValidationError } from "@mms/shared";
import { notify } from "@/lib/notify";

export interface UseMmsFormOptions<TFieldValues extends FieldValues = FieldValues> {
  schema: any;
  fields: Record<string, FieldDefinition[]>;
  initialData?: any;
  defaultValues?: any;
  t: (key: any, options?: any) => string;
}

export interface UseMmsFormReturn<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues, any, any>;
  tab: string;
  setTab: (tab: string) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  errors: ValidationError[];
  errorSummary: string | undefined;
  handleSave: (onSubmit: (data: TFieldValues) => Promise<void> | void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

/**
 * Reusable hook for orchestrating dynamic entity forms in MMS.
 * Handles state initialization, validation schema binding, validation error traversal,
 * error-focused tab auto-navigation, and save state coordination.
 */
export function useMmsForm<TFieldValues extends FieldValues = FieldValues>({
  schema,
  fields,
  initialData,
  defaultValues = {},
  t,
}: UseMmsFormOptions<TFieldValues>): UseMmsFormReturn<TFieldValues> {
  const [tab, setTab] = useState<string>("basic");
  const [saving, setSaving] = useState<boolean>(false);

  // Initialize form values conforming to Rule 12 for crash-free dynamic rendering
  const formInitialValues = useMemo(() => {
    const initial: Record<string, any> = { ...defaultValues };

    Object.values(fields).forEach((tabFields) => {
      (tabFields || []).forEach((f) => {
        if (f.enabled && initial[f.key] === undefined) {
          initial[f.key] = getDefaultFieldValue(f);
        }
      });
    });

    if (initialData) {
      Object.entries(initialData).forEach(([key, val]) => {
        initial[key] = val;
      });
    }

    // Normalize any loaded data to prevent uncontrolled warnings
    Object.values(fields).forEach((tabFields) => {
      (tabFields || []).forEach((f) => {
        if (f.enabled) {
          const val = initial[f.key];
          if (val === undefined || (val === null && getDefaultFieldValue(f) !== null)) {
            initial[f.key] = getDefaultFieldValue(f);
          }
        }
      });
    });

    return initial as DefaultValues<TFieldValues>;
  }, [initialData, fields, defaultValues]);

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema as any),
    defaultValues: formInitialValues,
  });

  const { handleSubmit, formState: { errors: formErrors } } = form;

  const getTabForField = useCallback((fieldId: string): string => {
    // List tabs that map directly to arrays/special components in contacts
    const listTabKeys = ["phones", "emails", "addresses", "socials", "emergencyContacts", "relationships"];
    if (listTabKeys.includes(fieldId)) {
      const tabMap: Record<string, string> = {
        phones: "phones",
        emails: "emails",
        addresses: "addresses",
        socials: "socials",
        emergencyContacts: "emergency",
        relationships: "relationships",
      };
      return tabMap[fieldId] || "basic";
    }

    // Handle student specific link fields
    let mappedFieldId = fieldId;
    if (fieldId === "fatherContactId") mappedFieldId = "fatherLink";
    if (fieldId === "motherContactId") mappedFieldId = "motherLink";
    if (fieldId === "guardianContactId") mappedFieldId = "guardianLink";

    for (const [tabIdKey, tabFields] of Object.entries(fields)) {
      if (tabFields.some((f) => f.key === mappedFieldId)) {
        return tabIdKey;
      }
    }
    return "basic";
  }, [fields]);

  // Convert React Hook Form errors to ValidationError[] format
  const errors = useMemo<ValidationError[]>(() => {
    const list: ValidationError[] = [];
    if (!formErrors) return list;

    const traverse = (obj: any, path: string[] = []) => {
      if (!obj || typeof obj !== "object") return;

      if (obj.message && typeof obj.message === "string") {
        if (path.length === 0) return;
        const firstKey = path[0];
        const listTabKeys = ["phones", "emails", "addresses", "socials", "emergencyContacts", "relationships"];

        if (listTabKeys.includes(firstKey) && path[1] !== undefined) {
          const arrayName = firstKey;
          const index = parseInt(path[1], 10);
          const subFieldId = path[2] || "";
          
          const tabIdMap: Record<string, string> = {
            phones: "phones",
            emails: "emails",
            addresses: "addresses",
            socials: "socials",
            emergencyContacts: "emergency",
            relationships: "relationships",
          };
          const prefixMap: Record<string, string> = {
            phones: "Phone",
            emails: "Email",
            addresses: "Address",
            socials: "Social Link",
            emergencyContacts: "Emergency Contact",
            relationships: "Relationship",
          };
          const tabId = tabIdMap[arrayName] || arrayName;
          const prefix = prefixMap[arrayName] || arrayName;

          list.push({
            fieldId: subFieldId,
            tabId,
            message: `${prefix} #${index + 1}: ${obj.message}`,
            index,
          });
        } else {
          let mappedFieldId = firstKey;
          if (firstKey === "fatherContactId") mappedFieldId = "fatherLink";
          if (firstKey === "motherContactId") mappedFieldId = "motherLink";
          if (firstKey === "guardianContactId") mappedFieldId = "guardianLink";

          let tabId = "basic";
          for (const [tId, tabFields] of Object.entries(fields)) {
            if (tabFields.some((f) => f.key === mappedFieldId)) {
              tabId = tId;
              break;
            }
          }
          list.push({
            fieldId: mappedFieldId,
            tabId,
            message: obj.message,
          });
        }
        return;
      }

      Object.entries(obj).forEach(([key, val]) => {
        traverse(val, [...path, key]);
      });
    };

    traverse(formErrors);
    return list;
  }, [formErrors, fields]);

  const errorSummary = useMemo(() => {
    return errors.length > 0 ? errors[0].message : undefined;
  }, [errors]);

  const handleSave = useCallback((onSubmit: (data: TFieldValues) => Promise<void> | void) => {
    const onFormSubmit = async (data: TFieldValues) => {
      setSaving(true);
      try {
        await onSubmit(data);
      } catch (err: any) {
        notify.error(t('settings.serverSaveFailed'), { description: err.message });
      } finally {
        setSaving(false);
      }
    };

    const onFormError = (errors: any) => {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const tabId = getTabForField(firstErrorKey);
        setTab(tabId);

        let errNode = errors[firstErrorKey];
        while (errNode && !errNode.message && typeof errNode === "object") {
          const nextKey = Object.keys(errNode)[0];
          errNode = errNode[nextKey];
        }

        const errorMsg = errNode?.message || t('contacts.form.pleaseFixErrors');
        notify.error(t('contacts.form.pleaseFixErrors'), { description: String(errorMsg) });

        // Smooth scroll to the invalid input (Rule 11.2)
        setTimeout(() => {
          let subFieldId = "";
          let arrayIndex = -1;

          const errorVal = errors[firstErrorKey];
          if (Array.isArray(errorVal)) {
            const index = errorVal.findIndex(Boolean);
            if (index !== -1) {
              arrayIndex = index;
              const subObj = errorVal[index];
              if (subObj && typeof subObj === "object") {
                subFieldId = Object.keys(subObj)[0] || "";
              }
            }
          }

          let selector = "";
          if (arrayIndex !== -1 && subFieldId) {
            selector = `#${firstErrorKey}-${arrayIndex}-${subFieldId}, #${firstErrorKey}-${arrayIndex}`;
          } else {
            selector = `#${firstErrorKey}, [data-field-key="${firstErrorKey}"]`;
          }

          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            const input = element.tagName === "INPUT" || element.tagName === "TEXTAREA" 
              ? element 
              : element.querySelector("input, textarea, select, button");
            if (input && typeof (input as HTMLElement).focus === "function") {
              (input as HTMLElement).focus();
            }
          }
        }, 100);
      }
    };

    return handleSubmit(onFormSubmit as any, onFormError);
  }, [handleSubmit, getTabForField, t]);

  return {
    form,
    tab,
    setTab,
    saving,
    setSaving,
    errors,
    errorSummary,
    handleSave,
  };
}

