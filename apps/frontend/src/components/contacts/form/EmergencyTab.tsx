import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormEmptyState, RequiredBanner, EditableSelect, CustomFieldInput, COLLECTION_CARD, COLLECTION_BODY, CardRemoveButton } from "./FormPrimitives";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { useVisibleContactFields } from "../../../hooks/useVisibleContactFields";
import useTranslation from "@/hooks/useTranslation";
import ContactPicker from "@/components/contactLink/ContactPicker";

interface ContactPhone {
  label: string;
  number: string;
  countryCode?: string;
}

interface ContactEmail {
  label: string;
  address: string;
}

interface Contact {
  id: string | number;
  name?: string;
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  [key: string]: unknown;
}

interface EmergencyContact {
  contactId?: string | number;
  relationship?: string;
  [key: string]: unknown;
}

interface ContactFormData extends Omit<Contact, "id"> {
  id?: string | number;
  emergencyContacts?: EmergencyContact[];
}

interface EmergencyTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
}

/**
 * EmergencyTab component for managing contact emergency contact linkages dynamically.
 */
export default function EmergencyTab({
  data,
  onChange,
  required = false,
}: EmergencyTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const enabledFields = useVisibleContactFields("emergency");

  const createNewEmergency = (): EmergencyContact => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      item[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
    });
    return item as EmergencyContact;
  };

  const list = data.emergencyContacts && data.emergencyContacts.length > 0 ? data.emergencyContacts : [createNewEmergency()];

  const upd = (l: EmergencyContact[]): void => {
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

  const updateEmergency = (i: number, patch: Partial<EmergencyContact>): void => {
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
                if (field.key === "contactId") {
                  return (
                    <div key={field.key}>
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
                      />
                    </div>
                  );
                }

                if (field.key === "relationship") {
                  return (
                    <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
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
                  <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
                    <CustomFieldInput
                      field={field}
                      value={(ec[field.key] as string | number | boolean | undefined) ?? ""}
                      onChange={(val) => updateEmergency(i, { [field.key]: val })}
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
