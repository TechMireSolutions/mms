import React from "react";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { listEnabledCustomContactFormFields } from "@mms/shared";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import {
  ContactSubListCustomFields,
  withSubListCustomFieldDefaults,
} from "./ContactSubListCustomFields";
import type { ContactSubListTabBaseProps } from "./types";

export interface ContactRelationshipTabProps extends ContactSubListTabBaseProps {
  relationshipOptions: string[];
}

function relationshipSelectOptions(
  catalog: readonly string[],
  currentValue: string | undefined,
): string[] {
  const value = typeof currentValue === "string" ? currentValue.trim() : "";
  if (!value) return [...catalog];
  const exists = catalog.some(
    (option) => option.trim().toLowerCase() === value.toLowerCase(),
  );
  return exists ? [...catalog] : [...catalog, value];
}

export function ContactRelationshipTab({
  contactDraft,
  getLocalId,
  relationshipOptions,
  isFieldEnabled,
  isFieldRequired,
  getListItemError,
  fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactRelationshipTabProps): JSX.Element {
  const { t } = useTranslation();
  const links = contactDraft.relationshipContacts || [];
  const showLinkedContact = isFieldEnabled("relationship", "contactId");
  const showRelationshipType = isFieldEnabled("relationship", "relationship");
  const customFields = listEnabledCustomContactFormFields(fields, "relationship");
  const allowAdd = resolveSubListAllowAdd(
    [showLinkedContact, showRelationshipType],
    customFields.length,
  );
  const contactIdRequired = isFieldRequired("relationship", "contactId");

  const emptyLink = () =>
    withSubListCustomFieldDefaults(
      {
        relationship: relationshipOptions[0] || "",
        contactId: "",
      },
      fields,
      "relationship",
    );

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
            const typeError = getListItemError("relationship", "relationship", idx);
            const typeValue = link.relationship || relationshipOptions[0] || "";
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
                        id={`relationship-contact-${idx}`}
                        name={`relationship-contact-${idx}`}
                        error={Boolean(pickerError)}
                      />
                      <FieldErrorMessage message={pickerError} />
                    </>
                  ) : null}

                  {showRelationshipType ? (
                    <Field
                      label={t("contacts.form.relationshipType")}
                      required={isFieldRequired("relationship", "relationship")}
                      error={typeError}
                    >
                      <FormSelect
                        options={relationshipSelectOptions(relationshipOptions, link.relationship)}
                        value={typeValue}
                        onChange={(val) =>
                          updateSubListItem("relationshipContacts", idx, { relationship: val })
                        }
                        placeholder={t("common.selectPlaceholder")}
                        className="w-full"
                        id={`relationship-type-${idx}`}
                        name={`relationship-type-${idx}`}
                      />
                    </Field>
                  ) : null}

                  <ContactSubListCustomFields
                    tabId="relationship"
                    fields={fields}
                    formInstanceId={formInstanceId}
                    rowIndex={idx}
                    row={link}
                    getListItemError={getListItemError}
                    onPatch={(patch) =>
                      updateSubListItem("relationshipContacts", idx, patch)
                    }
                  />
                </div>
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </ContactSubListShell>
    </div>
  );
}
