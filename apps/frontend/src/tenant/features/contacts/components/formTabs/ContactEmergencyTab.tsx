import React from "react";
import { Heart, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import ContactPicker from "@/tenant/features/contacts/components/contactLink/ContactPicker";
import { ListFieldCard, EmptyListCard } from "./FormCardUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, EmergencyContact, RELATIONSHIPS } from "@mms/shared";

export interface ContactEmergencyTabProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  relationshipOptions: string[];
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  addSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    newItem: NonNullable<Contact[K]>[number]
  ) => void;
  updateSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    idx: number,
    patch: Partial<NonNullable<Contact[K]>[number]>
  ) => void;
  removeSubListItem: (fieldKey: "phones" | "emails" | "addresses" | "socials" | "emergencyContacts", idx: number) => void;
}

export function ContactEmergencyTab({
  contactDraft,
  getLocalId,
  relationshipOptions,
  getListItemError,
  addSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEmergencyTabProps): JSX.Element {
  const { t } = useTranslation();
  const emergencyContacts = contactDraft.emergencyContacts || [];
  const addEmergency = () => {
    addSubListItem("emergencyContacts", { relationship: relationshipOptions[0] || t("contacts.form.father"), contactId: "" });
  };
  const removeEmergency = (idx: number) => removeSubListItem("emergencyContacts", idx);
  const updateEmergency = (idx: number, patch: Partial<EmergencyContact>) => updateSubListItem("emergencyContacts", idx, patch);

  const excludeIds = (idx: number): (string | number)[] => {
    const linked = emergencyContacts
      .filter((_, i) => i !== idx)
      .map((em) => em.contactId)
      .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
    if (contactDraft.id != null) linked.unshift(contactDraft.id);
    return linked;
  };

  return (
    <div className="space-y-3 text-left">
      {emergencyContacts.length === 0 && (
        <EmptyListCard icon={Heart} message={t("contacts.form.noEmergencyContactsYet")} />
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {emergencyContacts.map((em, idx) => {
            const pickerError = getListItemError("emergency", "contactId", idx);
            return (
              <ListFieldCard
                key={getLocalId("emergency", idx)}
                id={getLocalId("emergency", idx)}
                index={idx}
                icon={Heart}
                accentClass="bg-rose-500/60 group-hover:bg-rose-500"
                iconClass="text-rose-500/70 group-hover:text-rose-500"
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
                    allowCreate={false}
                    searchPlaceholder={t("contacts.form.searchByName")}
                    emptyTitle={t("contacts.form.noContactsFound")}
                    id={`emergency-contact-${idx}`}
                    name={`emergency-contact-${idx}`}
                  />
                  {pickerError && (
                    <p className="text-[10px] text-destructive mt-0.5 font-medium">
                      {pickerError}
                    </p>
                  )}

                  <Field label={t("contacts.form.relationshipType")} id={`emergency-relationship-${idx}`}>
                    <EditableSelect
                      options={
                        relationshipOptions.length > 0
                          ? relationshipOptions
                          : (RELATIONSHIPS as unknown as string[])
                      }
                      value={em.relationship || t("contacts.form.father")}
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
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={addEmergency}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmergencyContact")}</span>
      </Button>
    </div>
  );
}
