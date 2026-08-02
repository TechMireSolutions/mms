import React from "react";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { RelationshipContact } from "@mms/shared";

export interface ContactRelationshipTabProps extends ContactSubListTabBaseProps {
  relationshipOptions: string[];
  onUpdateRelationships: (relationships: string[]) => void;
}

export function ContactRelationshipTab({
  contactDraft,
  getLocalId,
  relationshipOptions,
  onUpdateRelationships,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactRelationshipTabProps): JSX.Element {
  const { t } = useTranslation();
  const links = contactDraft.relationshipContacts || [];
  const emptyLink = () => ({
    relationship: relationshipOptions[0] || "",
    contactId: "",
  });
  const addLink = () => {
    addSubListItem("relationshipContacts", emptyLink());
  };
  const ensureLink = () => {
    ensureSubListItem("relationshipContacts", emptyLink());
  };
  const removeLink = (idx: number) => removeSubListItem("relationshipContacts", idx);
  const updateLink = (idx: number, patch: Partial<RelationshipContact>) =>
    updateSubListItem("relationshipContacts", idx, patch);

  const excludeIds = (idx: number): (string | number)[] => {
    const linked = links
      .filter((_, i) => i !== idx)
      .map((em) => em.contactId)
      .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
    if (contactDraft.id != null) linked.unshift(contactDraft.id);
    return linked;
  };

  return (
    <ContactSubListShell
      isEmpty={links.length === 0}
      emptyIcon={Heart}
      emptyMessage={t("contacts.form.noRelationshipsSet")}
      addLabel={t("contacts.form.addRelationshipLink")}
      onAdd={addLink}
      onEnsureRow={ensureLink}
    >
      <AnimatePresence initial={false}>
        {links.map((em, idx) => {
          const pickerError = getListItemError("relationship", "contactId", idx);
          return (
            <ListFieldCard
              key={getLocalId("relationship", idx)}
              id={getLocalId("relationship", idx)}
              index={idx}
              icon={Heart}
              accentClass="bg-destructive/60 group-hover:bg-destructive"
              iconClass="text-destructive/70 group-hover:text-destructive"
              label={`${t("contacts.form.contact")} ${idx + 1}`}
              onRemove={() => removeLink(idx)}
              removeLabel={t("contacts.form.removeRelationship", { index: idx + 1 })}
            >
              <div className="space-y-3">
                <ContactPicker
                  label={t("contacts.form.linkContact")}
                  value={em.contactId ?? null}
                  onChange={(id) => {
                    updateLink(idx, {
                      contactId: id != null ? String(id) : "",
                    });
                  }}
                  excludeIds={excludeIds(idx)}
                  searchPlaceholder={t("contacts.form.searchByName")}
                  emptyTitle={t("contacts.form.noContactsFound")}
                  id={`relationship-contact-${idx}`}
                  name={`relationship-contact-${idx}`}
                />
                <FieldInlineError message={pickerError} />

                <Field label={t("contacts.form.relationshipType")} id={`relationship-type-${idx}`}>
                  <EditableSelect
                    options={relationshipOptions}
                    value={em.relationship || relationshipOptions[0] || ""}
                    onChange={(val) => updateLink(idx, { relationship: val })}
                    onUpdateOptions={onUpdateRelationships}
                    className="w-full"
                    id={`relationship-type-${idx}`}
                    name={`relationship-type-${idx}`}
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
