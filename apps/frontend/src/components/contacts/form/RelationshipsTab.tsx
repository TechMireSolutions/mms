import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Users, Plus, Search, X } from "lucide-react";
import { Field, INPUT, FormEmptyState, EditableSelect, COLLECTION_CARD, CardRemoveButton } from "./FormPrimitives";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";

interface ContactSummary {
  id: string | number;
  name?: string;
  phones?: Array<{ number: string }>;
}

interface RelationshipItem {
  contactId: string | number;
  type: string;
}

interface ContactFormData {
  id?: string | number;
  relationships?: RelationshipItem[];
  [key: string]: unknown;
}

interface ContactSearchPickerProps {
  available: ContactSummary[];
  selectedId: string | number;
  onSelect: (id: string | number) => void;
}

function ContactSearchPicker({ available, selectedId, onSelect }: ContactSearchPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const selected = available.find((c) => String(c.id) === String(selectedId));

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q
      ? available.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            (c.phones || []).some((p) => p.number?.includes(q))
        )
      : available;
    return list.slice(0, 20);
  }, [available, query]);

  return (
    <div className="relative">
      {selected && !open ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm">
          <div>
            <span className="font-medium text-foreground">{selected.name}</span>
            {(selected.phones || [])[0]?.number && (
              <span className="ml-2 text-muted-foreground text-xs">{selected.phones![0].number}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setOpen(true);
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground ml-2 transition-colors"
            aria-label={t("contacts.form.clearSelectedContact")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className={`${INPUT} pl-9`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t("contacts.form.searchByName")}
          />
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground bg-card">{t("contacts.form.noContactsFound")}</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => {
                    onSelect(c.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-2 bg-card"
                >
                  <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{(c.phones || [])[0]?.number || ""}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface RelationshipsTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  allContacts: ContactSummary[];
}

/**
 * RelationshipsTab Component
 *
 * Renders a form tab for configuring bidirectional relationships (e.g., Mother, Father, Referrer)
 * between the current contact and other contacts in the CRM.
 *
 * @param props - Component properties.
 * @returns React element representing the relationships configuration UI.
 */
export default function RelationshipsTab({
  data,
  onChange,
  allContacts,
}: RelationshipsTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const list = data.relationships || [];
  const upd = (l: RelationshipItem[]): void => {
    onChange({ ...data, relationships: l });
  };
  const available = allContacts.filter((c) => String(c.id) !== String(data.id));

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

          <Field label={t("contacts.form.linkContact")} required>
            <ContactSearchPicker
              available={available}
              selectedId={r.contactId ?? ""}
              onSelect={(id) => upd(list.map((x, j) => (j === i ? { ...x, contactId: id } : x)))}
            />
          </Field>

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
