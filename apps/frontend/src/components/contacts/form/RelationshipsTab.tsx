import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Plus } from "lucide-react";
import { Field, FormEmptyState, EditableSelect, COLLECTION_CARD, CardRemoveButton } from "./FormPrimitives";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";
import ContactPicker from "@/components/contactLink/ContactPicker";

interface RelationshipItem {
  contactId: string | number;
  type: string;
}

interface ContactFormData {
  id?: string | number;
  relationships?: RelationshipItem[];
  [key: string]: unknown;
}

interface RelationshipsTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
}

/**
 * Registry-driven relationships tab — links use server-mode ContactPicker (globle2 §10).
 */
export default function RelationshipsTab({
  data,
  onChange,
}: RelationshipsTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const list = data.relationships || [];
  const upd = (l: RelationshipItem[]): void => {
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

      {list.map((r, i) => (
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
          />

          <Field label={t("contacts.form.relationshipType")} required>
            <EditableSelect
              options={relationships || []}
              value={r.type || ""}
              onChange={(val) =>
                upd(list.map((x, j) => (j === i ? { ...x, type: val } : x)))
              }
              onUpdateOptions={updateRelationships}
              placeholder={t("contacts.form.selectType")}
              className="w-full"
            />
          </Field>
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() => upd([...list, { contactId: "", type: "" }])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addRelationshipLink")}</span>
      </button>
    </div>
  );
}
