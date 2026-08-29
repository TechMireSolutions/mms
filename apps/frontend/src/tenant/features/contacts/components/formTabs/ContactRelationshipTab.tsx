import type React from "react";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { RELATIONSHIPS } from "@mms/shared";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { FieldErrorMessage, EditableSelect } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";

/** Fixed static frontend enum list for Relationship Type dropdown per requirements. */
export const STATIC_RELATIONSHIP_OPTIONS: readonly string[] = [...RELATIONSHIPS];

export interface ContactRelationshipTabProps extends ContactSubListTabBaseProps {
  relationshipOptions?: string[];
  onUpdateRelationships?: (options: string[]) => void;
}

export function ContactRelationshipTab({
  contactDraft,
  formInstanceId,
  relationshipOptions,
  onUpdateRelationships,
  getLocalId,
  isFieldEnabled,
  isFieldRequired,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactRelationshipTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const options = (relationshipOptions && relationshipOptions.length > 0
    ? relationshipOptions
    : STATIC_RELATIONSHIP_OPTIONS) as string[];
  const links = contactDraft.relationshipContacts || [];
  const showLinkedContact = isFieldEnabled("relationship", "contactId");
  const showRelationshipType = isFieldEnabled("relationship", "relationship");
  const allowAdd = resolveSubListAllowAdd([showLinkedContact, showRelationshipType]);
  const contactIdRequired = isFieldRequired("relationship", "contactId");

  const emptyLink = () => ({
    relationship: options[0] || "",
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
            const typeValue = link.relationship || options[0] || "";
            return (
              <ListFieldCard
                key={getLocalId("relationship", idx)}
                id={getLocalId("relationship", idx)}
                index={idx}
                accentClass={SUB_LIST_CARD_ACCENTS.relationships.accent}
                label={showRelationshipType ? `${t("contacts.form.relationshipType")}:` : undefined}
                typeSelect={
                  showRelationshipType ? (
                    <EditableSelect
                      options={options}
                      value={typeValue}
                      onChange={(val) =>
                        updateSubListItem("relationshipContacts", idx, { relationship: val })
                      }
                      onUpdateOptions={onUpdateRelationships}
                      placeholder={t("common.selectPlaceholder")}
                      className="w-40 @sm:w-52 min-w-0"
                      id={`cf-${formInstanceId}-relationship-type-${idx}`}
                      name={`cf-${formInstanceId}-relationship-type-${idx}`}
                    />
                  ) : undefined
                }
                onRemove={() => removeSubListItem("relationshipContacts", idx)}
                removeLabel={t("contacts.form.removeRelationship", { index: idx + 1 })}
              >
                <div className="space-y-3">
                  {showLinkedContact ? (
                    <div>
                      <ContactPicker
                        label={t("contacts.form.linkContact")}
                        required={contactIdRequired}
                        value={link.contactId ?? null}
                        onChange={(id) => {
                          updateSubListItem("relationshipContacts", idx, {
                            contactId: id != null ? String(id) : "",
                          });
                        }}
                        excludeIds={excludeIds(idx)}
                        searchPlaceholder={t("contacts.form.searchByName")}
                        emptyTitle={t("contacts.form.noContactsFound")}
                        id={`cf-${formInstanceId}-relationship-contact-${idx}`}
                        name={`cf-${formInstanceId}-relationship-contact-${idx}`}
                        error={Boolean(pickerError)}
                      />
                      <FieldErrorMessage message={pickerError} />
                    </div>
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
