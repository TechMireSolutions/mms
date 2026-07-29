import React from "react";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { EmergencyContact, RELATIONSHIPS } from "@mms/shared";

export interface ContactEmergencyTabProps extends ContactSubListTabBaseProps {
  relationshipOptions: string[];
}

export function ContactEmergencyTab({
  contactDraft,
  getLocalId,
  relationshipOptions,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEmergencyTabProps): JSX.Element {
  const { t } = useTranslation();
  const emergencyContacts = contactDraft.emergencyContacts || [];
  const emptyEmergency = () => ({
    relationship: relationshipOptions[0] || RELATIONSHIPS[0] || "",
    contactId: "",
  });
  const addEmergency = () => {
    addSubListItem("emergencyContacts", emptyEmergency());
  };
  const ensureEmergency = () => {
    ensureSubListItem("emergencyContacts", emptyEmergency());
  };
  const removeEmergency = (idx: number) => removeSubListItem("emergencyContacts", idx);
  const updateEmergency = (idx: number, patch: Partial<EmergencyContact>) =>
    updateSubListItem("emergencyContacts", idx, patch);

  const excludeIds = (idx: number): (string | number)[] => {
    const linked = emergencyContacts
      .filter((_, i) => i !== idx)
      .map((em) => em.contactId)
      .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
    if (contactDraft.id != null) linked.unshift(contactDraft.id);
    return linked;
  };

  return (
    <ContactSubListShell
      isEmpty={emergencyContacts.length === 0}
      emptyIcon={Heart}
      emptyMessage={t("contacts.form.noEmergencyContactsYet")}
      addLabel={t("contacts.form.addEmergencyContact")}
      onAdd={addEmergency}
      onEnsureRow={ensureEmergency}
    >
      <AnimatePresence initial={false}>
        {emergencyContacts.map((em, idx) => {
          const pickerError = getListItemError("emergency", "contactId", idx);
          return (
            <ListFieldCard
              key={getLocalId("emergency", idx)}
              id={getLocalId("emergency", idx)}
              index={idx}
              icon={Heart}
              accentClass="bg-destructive/60 group-hover:bg-destructive"
              iconClass="text-destructive/70 group-hover:text-destructive"
              label={`${t("contacts.form.contact")} ${idx + 1}`}
              onRemove={() => removeEmergency(idx)}
              removeLabel={t("contacts.form.removeEmergencyContact", { index: idx + 1 })}
            >
              <div className="space-y-3">
                <ContactPicker
                  label={t("contacts.form.linkContact")}
                  value={em.contactId ?? null}
                  onChange={(id) => {
                    updateEmergency(idx, {
                      contactId: id != null ? String(id) : "",
                    });
                  }}
                  excludeIds={excludeIds(idx)}
                  searchPlaceholder={t("contacts.form.searchByName")}
                  emptyTitle={t("contacts.form.noContactsFound")}
                  id={`emergency-contact-${idx}`}
                  name={`emergency-contact-${idx}`}
                />
                <FieldInlineError message={pickerError} />

                <Field label={t("contacts.form.relationshipType")} id={`emergency-relationship-${idx}`}>
                  <EditableSelect
                    options={
                      relationshipOptions.length > 0
                        ? relationshipOptions
                        : (RELATIONSHIPS as unknown as string[])
                    }
                    value={em.relationship || relationshipOptions[0] || RELATIONSHIPS[0] || ""}
                    onChange={(val) => updateEmergency(idx, { relationship: val })}
                    className="w-full"
                    id={`emergency-relationship-${idx}`}
                    name={`emergency-relationship-${idx}`}
                  />
                </Field>
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
