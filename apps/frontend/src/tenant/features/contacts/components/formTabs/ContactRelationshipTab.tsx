import React from "react";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { RelationshipContact } from "@mms/shared";
import { Field } from "@/components/ui/FormPrimitives";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { useRelationshipTypeOptions } from "@/tenant/features/contacts/hooks/useRelationshipTypeOptions";
import { RelationshipTypeSelect } from "./RelationshipTypeSelect";

export interface ContactRelationshipTabProps extends ContactSubListTabBaseProps {
  relationshipOptions: string[];
  onUpdateRelationships: (relationships: string[]) => void;
}

export function ContactRelationshipTab({
  contactDraft,
  getLocalId,
  relationshipOptions,
  onUpdateRelationships,
  isFieldEnabled,
  isFieldRequired,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactRelationshipTabProps): JSX.Element {
  const { t } = useTranslation();
  const { addPair, updateOptions } = useRelationshipTypeOptions(
    relationshipOptions,
    onUpdateRelationships,
  );
  const links = contactDraft.relationshipContacts || [];
  const showLinkedContact = isFieldEnabled("relationship", "contactId");
  const showRelationshipType = isFieldEnabled("relationship", "relationship");
  const allowAdd = showLinkedContact || showRelationshipType;

  const emptyLink = (): RelationshipContact => ({
    relationship: relationshipOptions[0] || "",
    contactId: "",
  });

  const excludeIds = (idx: number): (string | number)[] => {
    const linked = links
      .filter((_, i) => i !== idx)
      .map((link) => link.contactId)
      .filter((cid) => cid != null && String(cid).length > 0) as (string | number)[];
    if (contactDraft.id != null) linked.unshift(contactDraft.id);
    return linked;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t("contacts.form.relationshipInstructions")}
      </p>
      <ContactSubListShell
        isEmpty={links.length === 0}
        emptyIcon={Heart}
        emptyMessage={t("contacts.form.noRelationshipsSet")}
        addLabel={t("contacts.form.addRelationshipLink")}
        onAdd={() => addSubListItem("relationshipContacts", emptyLink())}
        onEnsureRow={() => ensureSubListItem("relationshipContacts", emptyLink())}
        allowAdd={allowAdd}
      >
        <AnimatePresence initial={false}>
          {links.map((link, idx) => {
            const pickerError = getListItemError("relationship", "contactId", idx);
            return (
              <ListFieldCard
                key={getLocalId("relationship", idx)}
                id={getLocalId("relationship", idx)}
                index={idx}
                icon={Heart}
                accentClass="bg-primary/60 group-hover:bg-primary"
                iconClass="text-primary/70 group-hover:text-primary"
                label={`${t("contacts.form.contact")} ${idx + 1}`}
                onRemove={() => removeSubListItem("relationshipContacts", idx)}
                removeLabel={t("contacts.form.removeRelationship", { index: idx + 1 })}
              >
                <div className="space-y-3">
                  {showLinkedContact ? (
                    <>
                      <ContactPicker
                        label={t("contacts.form.linkContact")}
                        value={link.contactId ?? null}
                        onChange={(id) => {
                          updateSubListItem("relationshipContacts", idx, {
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
                    </>
                  ) : null}

                  {showRelationshipType ? (
                    <Field
                      label={t("contacts.form.relationshipType")}
                      required={isFieldRequired("relationship", "relationship")}
                      id={`relationship-type-${idx}`}
                    >
                      <RelationshipTypeSelect
                        options={relationshipOptions}
                        value={link.relationship || relationshipOptions[0] || ""}
                        onChange={(val) =>
                          updateSubListItem("relationshipContacts", idx, { relationship: val })
                        }
                        onUpdateOptions={(next) => {
                          void updateOptions(next);
                        }}
                        onAddPair={addPair}
                        className="w-full"
                        id={`relationship-type-${idx}`}
                        name={`relationship-type-${idx}`}
                      />
                    </Field>
                  ) : null}
                </div>
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </ContactSubListShell>
    </div>
  );
}
