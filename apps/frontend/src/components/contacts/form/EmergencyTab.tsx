import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultFieldValue, Contact, EmergencyContact } from "@mms/shared";
import { Field, FormEmptyState, RequiredBanner, EditableSelect, CustomFieldInput, COLLECTION_CARD, COLLECTION_BODY, CardRemoveButton } from "@/components/ui/FormPrimitives";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useTranslation } from "@/hooks/useTranslation";
import ContactPicker from "@/components/contactLink/ContactPicker";

type ContactEmergency = EmergencyContact & Record<string, unknown>;

interface EmergencyTabProps {
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
  required?: boolean;
  errors?: ValidationError[];
}

/**
 * EmergencyTab component for managing contact emergency contact linkages dynamically.
 */
export default function EmergencyTab({
  data,
  onChange,
  required = false,
  errors = [],
}: EmergencyTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const enabledFields = useVisibleContactFields("emergency");

  const createNewEmergency = (): ContactEmergency => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      item[f.key] = getDefaultFieldValue(f);
    });
    return item as ContactEmergency;
  };

  const list = (data.emergencyContacts || []) as ContactEmergency[];

  const upd = (l: ContactEmergency[]): void => {
    onChange({ ...data, emergencyContacts: l });
  };

  const excludeIdsForRow = (rowIndex: number): (string | number)[] => {
    const linked = list
      .filter((_, j) => j !== rowIndex)
      .map((row) => row.contactId)
      .filter((id) => id != null && String(id).length > 0) as (string | number)[];
    if (data.id != null) linked.unshift(data.id);
    return linked;
  };

  const updateEmergency = (i: number, patch: Partial<ContactEmergency>): void => {
    upd(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("contacts.form.emergencyInstructions")}</p>
      </div>

      {required && list.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneEmergencyContactRequired")} />}
      {list.length === 0 && <FormEmptyState icon={Heart} text={t("contacts.form.noEmergencyContactsYet")} />}

      {list.map((ec, i) => (
        <motion.div
          key={i}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={COLLECTION_CARD}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t("contacts.form.contact")} {i + 1}</span>
            <CardRemoveButton
              onClick={() => upd(list.filter((_, j) => j !== i))}
              label={t("contacts.form.removeEmergencyContact", { index: i + 1 })}
            />
          </div>

          {enabledFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {enabledFields.map((field) => {
                const fieldError = errors.find(
                  (err) => err.tabId === "emergency" && err.index === i && err.fieldId === field.key
                );

                if (field.key === "contactId") {
                  return (
                    <div key={field.key} id={`emergencyContacts-${i}-contactId`} data-field-key={`emergencyContacts-${i}-contactId`}>
                      <ContactPicker
                        label={`${field.label}${field.required ? " *" : ""}`}
                        value={ec.contactId ?? null}
                        onChange={(id) =>
                          updateEmergency(i, { contactId: id != null && id !== "" ? String(id) : "" })
                        }
                        excludeIds={excludeIdsForRow(i)}
                        allowCreate={false}
                        searchPlaceholder={t("contacts.form.searchByNamePhone")}
                        emptyTitle={t("contacts.form.noContactsFound")}
                        error={!!fieldError}
                      />
                      {fieldError && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">{fieldError.message}</p>
                      )}
                    </div>
                  );
                }

                if (field.key === "relationship") {
                  return (
                    <Field key={field.key} id={`emergencyContacts-${i}-relationship`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                      <EditableSelect
                        options={relationships || []}
                        value={ec.relationship || ""}
                        onChange={(val) => updateEmergency(i, { relationship: val })}
                        onUpdateOptions={updateRelationships}
                        placeholder={t("contacts.form.selectType")}
                        className="w-full"
                      />
                    </Field>
                  );
                }

                return (
                  <Field key={field.key} id={`emergencyContacts-${i}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={(ec[field.key] as string | number | boolean | undefined) ?? ""}
                      onChange={(val) => updateEmergency(i, { [field.key]: val })}
                      error={!!fieldError}
                    />
                  </Field>
                );
              })}
            </div>
          )}
        </motion.div>
      ))}

      <Button
        type="button"
        variant="ghost"
        onClick={() => upd([...list, createNewEmergency()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmergencyContact")}</span>
      </Button>
    </div>
  );
}
