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
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
  required?: boolean;
  errors?: ValidationError[];
}

/**
 * EmergencyTab component for managing contact emergency contact linkages dynamically.
 */
export default function EmergencyTab({
  contactDraft,
  onChange,
  required = false,
  errors = [],
}: EmergencyTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const enabledFields = useVisibleContactFields("emergency");

  const createNewEmergency = (): ContactEmergency => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((field) => {
      item[field.key] = getDefaultFieldValue(field);
    });
    return item as ContactEmergency;
  };

  const emergencyContacts = (contactDraft.emergencyContacts || []) as ContactEmergency[];

  const updateEmergencyContacts = (nextEmergencyContacts: ContactEmergency[]): void => {
    onChange({ ...contactDraft, emergencyContacts: nextEmergencyContacts });
  };

  const excludeIdsForRow = (rowIndex: number): (string | number)[] => {
    const linkedContactIds = emergencyContacts
      .filter((_, index) => index !== rowIndex)
      .map((emergencyContact) => emergencyContact.contactId)
      .filter((contactId) => contactId != null && String(contactId).length > 0) as (string | number)[];
    if (contactDraft.id != null) linkedContactIds.unshift(contactDraft.id);
    return linkedContactIds;
  };

  const updateEmergencyContact = (emergencyContactIndex: number, patch: Partial<ContactEmergency>): void => {
    updateEmergencyContacts(
      emergencyContacts.map((emergencyContact, index) =>
        index === emergencyContactIndex ? { ...emergencyContact, ...patch } : emergencyContact,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("contacts.form.emergencyInstructions")}</p>
      </div>

      {required && emergencyContacts.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneEmergencyContactRequired")} />}
      {emergencyContacts.length === 0 && <FormEmptyState icon={Heart} text={t("contacts.form.noEmergencyContactsYet")} />}

      {emergencyContacts.map((emergencyContact, emergencyContactIndex) => (
        <motion.div
          key={emergencyContactIndex}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={COLLECTION_CARD}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t("contacts.form.contact")} {emergencyContactIndex + 1}</span>
            <CardRemoveButton
              onClick={() => updateEmergencyContacts(emergencyContacts.filter((_, index) => index !== emergencyContactIndex))}
              label={t("contacts.form.removeEmergencyContact", { index: emergencyContactIndex + 1 })}
            />
          </div>

          {enabledFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {enabledFields.map((field) => {
                const fieldError = errors.find(
                  (error) => error.tabId === "emergency" && error.index === emergencyContactIndex && error.fieldId === field.key
                );

                if (field.key === "contactId") {
                  return (
                    <div key={field.key} id={`emergencyContacts-${emergencyContactIndex}-contactId`} data-field-key={`emergencyContacts-${emergencyContactIndex}-contactId`}>
                      <ContactPicker
                        label={`${field.label}${field.required ? " *" : ""}`}
                        value={emergencyContact.contactId ?? null}
                        onChange={(id) =>
                          updateEmergencyContact(emergencyContactIndex, { contactId: id != null && id !== "" ? String(id) : "" })
                        }
                        excludeIds={excludeIdsForRow(emergencyContactIndex)}
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
                    <Field key={field.key} id={`emergencyContacts-${emergencyContactIndex}-relationship`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                      <EditableSelect
                        options={relationships || []}
                        value={emergencyContact.relationship || ""}
                        onChange={(value) => updateEmergencyContact(emergencyContactIndex, { relationship: value })}
                        onUpdateOptions={updateRelationships}
                        placeholder={t("contacts.form.selectType")}
                        className="w-full"
                      />
                    </Field>
                  );
                }

                return (
                  <Field key={field.key} id={`emergencyContacts-${emergencyContactIndex}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={(emergencyContact[field.key] as string | number | boolean | undefined) ?? ""}
                      onChange={(value) => updateEmergencyContact(emergencyContactIndex, { [field.key]: value })}
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
        onClick={() => updateEmergencyContacts([...emergencyContacts, createNewEmergency()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmergencyContact")}</span>
      </Button>
    </div>
  );
}
