import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormEmptyState, EditableSelect, COLLECTION_CARD, CardRemoveButton } from "@/components/ui/FormPrimitives";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Contact, ContactRelationship } from "@mms/shared";

interface RelationshipsTabProps {
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
  errors?: ValidationError[];
}

/**
 * Registry-driven relationships tab — links use server-mode ContactPicker (globle2 §10).
 */
export default function RelationshipsTab({
  contactDraft,
  onChange,
  errors = [],
}: RelationshipsTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const contactRelationships = contactDraft.relationships || [];
  const updateContactRelationships = (relationshipsList: ContactRelationship[]): void => {
    onChange({ ...contactDraft, relationships: relationshipsList });
  };

  const excludeIdsForRow = (rowIndex: number): (string | number)[] => {
    const linkedContactIds = contactRelationships
      .filter((_, index) => index !== rowIndex)
      .map((relationship) => relationship.contactId)
      .filter((id) => id != null && String(id).length > 0);
    if (contactDraft.id != null) linkedContactIds.unshift(contactDraft.id);
    return linkedContactIds;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("contacts.form.relationshipInstructions")}</p>
      </div>

      {contactRelationships.length === 0 && <FormEmptyState icon={Users} text={t("contacts.form.noRelationshipsSet")} />}

      {contactRelationships.map((relationship, relationshipIndex) => {
        const contactError = errors?.find(
          (error) => error.tabId === "relationships" && error.index === relationshipIndex && error.fieldId === "contactId"
        );
        const typeError = errors?.find(
          (error) => error.tabId === "relationships" && error.index === relationshipIndex && error.fieldId === "relationship"
        );
        return (
          <motion.div
            key={relationshipIndex}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={COLLECTION_CARD}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{t("contacts.form.link")} {relationshipIndex + 1}</span>
              <CardRemoveButton
                onClick={() => updateContactRelationships(contactRelationships.filter((_, index) => index !== relationshipIndex))}
                label={t("contacts.form.removeRelationship", { index: relationshipIndex + 1 })}
              />
            </div>

            <div id={`relationships-${relationshipIndex}-contactId`} data-field-key={`relationships-${relationshipIndex}-contactId`}>
              <ContactPicker
                label={`${t("contacts.form.linkContact")} *`}
                value={relationship.contactId ?? null}
                onChange={(id) =>
                  updateContactRelationships(
                    contactRelationships.map((contactRelationship, index) =>
                      index === relationshipIndex ? { ...contactRelationship, contactId: id ?? "" } : contactRelationship,
                    ),
                  )
                }
                excludeIds={excludeIdsForRow(relationshipIndex)}
                allowCreate={false}
                searchPlaceholder={t("contacts.form.searchByName")}
                emptyTitle={t("contacts.form.noContactsFound")}
                error={!!contactError}
              />
              {contactError && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{contactError.message}</p>
              )}
            </div>

            <Field id={`relationships-${relationshipIndex}-relationship`} label={t("contacts.form.relationshipType")} required error={typeError?.message}>
              <EditableSelect
                options={relationships || []}
                value={relationship.relationship || ""}
                onChange={(relationshipValue) =>
                  updateContactRelationships(
                    contactRelationships.map((contactRelationship, index) =>
                      index === relationshipIndex
                        ? { ...contactRelationship, relationship: relationshipValue }
                        : contactRelationship,
                    ),
                  )
                }
                onUpdateOptions={updateRelationships}
                placeholder={t("contacts.form.selectType")}
                className="w-full"
              />
            </Field>
          </motion.div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        onClick={() => updateContactRelationships([...contactRelationships, { contactId: "", relationship: "" }])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addRelationshipLink")}</span>
      </Button>
    </div>
  );
}
