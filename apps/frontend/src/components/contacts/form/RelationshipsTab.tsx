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
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
  errors?: ValidationError[];
}

/**
 * Registry-driven relationships tab — links use server-mode ContactPicker (globle2 §10).
 */
export default function RelationshipsTab({
  data,
  onChange,
  errors = [],
}: RelationshipsTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const list = data.relationships || [];
  const upd = (l: ContactRelationship[]): void => {
    onChange({ ...data, relationships: l });
  };

  const excludeIdsForRow = (rowIndex: number): (string | number)[] => {
    const linked = list
      .filter((_, j) => j !== rowIndex)
      .map((row) => row.contactId)
      .filter((id) => id != null && String(id).length > 0);
    if (data.id != null) linked.unshift(data.id);
    return linked;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("contacts.form.relationshipInstructions")}</p>
      </div>

      {list.length === 0 && <FormEmptyState icon={Users} text={t("contacts.form.noRelationshipsSet")} />}

      {list.map((r, i) => {
        const contactError = errors?.find(
          (e) => e.tabId === "relationships" && e.index === i && e.fieldId === "contactId"
        );
        const typeError = errors?.find(
          (e) => e.tabId === "relationships" && e.index === i && e.fieldId === "relationship"
        );
        return (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={COLLECTION_CARD}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{t("contacts.form.link")} {i + 1}</span>
              <CardRemoveButton
                onClick={() => upd(list.filter((_, j) => j !== i))}
                label={t("contacts.form.removeRelationship", { index: i + 1 })}
              />
            </div>

            <div id={`relationships-${i}-contactId`} data-field-key={`relationships-${i}-contactId`}>
              <ContactPicker
                label={`${t("contacts.form.linkContact")} *`}
                value={r.contactId ?? null}
                onChange={(id) =>
                  upd(list.map((x, j) => (j === i ? { ...x, contactId: id ?? "" } : x)))
                }
                excludeIds={excludeIdsForRow(i)}
                allowCreate={false}
                searchPlaceholder={t("contacts.form.searchByName")}
                emptyTitle={t("contacts.form.noContactsFound")}
                error={!!contactError}
              />
              {contactError && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{contactError.message}</p>
              )}
            </div>

            <Field id={`relationships-${i}-relationship`} label={t("contacts.form.relationshipType")} required error={typeError?.message}>
              <EditableSelect
                options={relationships || []}
                value={r.relationship || ""}
                onChange={(val) =>
                  upd(list.map((x, j) => (j === i ? { ...x, relationship: val } : x)))
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
        onClick={() => upd([...list, { contactId: "", relationship: "" }])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addRelationshipLink")}</span>
      </Button>
    </div>
  );
}
