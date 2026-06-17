import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Heart, Plus, Search, X } from "lucide-react";
import { Field, INPUT, FormEmptyState, RequiredBanner, EditableSelect, CustomFieldInput, COLLECTION_CARD, COLLECTION_BODY, CardRemoveButton } from "./FormPrimitives";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { useSortedFields } from "../../../hooks/useSortedFields";
import useTranslation from "@/hooks/useTranslation";

interface ContactPhone {
  label: string;
  number: string;
  countryCode?: string;
}

interface ContactEmail {
  label: string;
  address: string;
}

interface Contact {
  id: string | number;
  name?: string;
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  [key: string]: unknown;
}

interface EmergencyContact {
  contactId?: string | number;
  relationship?: string;
  [key: string]: unknown;
}

interface ContactFormData extends Omit<Contact, "id"> {
  id?: string | number;
  emergencyContacts?: EmergencyContact[];
}

interface ContactSearchPickerProps {
  available: Contact[];
  selectedId: string | number;
  onSelect: (id: string | number) => void;
}

/**
 * ContactSearchPicker component for searching and picking an existing contact.
 * @param props Component properties.
 * @returns React element.
 */
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
            placeholder={t("contacts.form.searchByNamePhone")}
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

interface EmergencyTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  allContacts: Contact[];
  required?: boolean;
}

/**
 * EmergencyTab component for managing contact emergency contact linkages dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function EmergencyTab({
  data,
  onChange,
  allContacts,
  required = false,
}: EmergencyTabProps): React.JSX.Element {
  const { relationships, updateRelationships } = useContactConfig();
  const { t } = useTranslation();
  const enabledFields = useSortedFields("emergency").filter((f) => f.enabled);

  const createNewEmergency = (): EmergencyContact => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      item[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
    });
    return item as EmergencyContact;
  };

  const list = data.emergencyContacts && data.emergencyContacts.length > 0 ? data.emergencyContacts : [createNewEmergency()];
  
  const upd = (l: EmergencyContact[]): void => {
    onChange({ ...data, emergencyContacts: l });
  };
  
  const available = allContacts.filter((c) => c.id !== data.id);

  const updateEmergency = (i: number, patch: Partial<EmergencyContact>): void => {
    upd(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("contacts.form.emergencyInstructions")}</p>
      </div>

      {required && list.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneEmergencyContactRequired")} />}
      {list.length === 0 && <FormEmptyState icon={Heart} text={t("contacts.form.noEmergencyContactsYet")} />}

      {list.map((ec, i) => {
        const sel = available.find((c) => String(c.id) === String(ec.contactId));
        return (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={COLLECTION_CARD}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">{t("contacts.form.contact")} {i + 1}</span>
              <CardRemoveButton
                onClick={() => upd(list.filter((_, j) => j !== i))}
                label={t("contacts.form.removeEmergencyContact", { index: i + 1 })}
              />
            </div>

            {enabledFields.length > 0 && (
              <div className={COLLECTION_BODY}>
                {enabledFields.map((field) => {
                  if (field.key === "contactId") {
                    return (
                      <div key={field.key} className="space-y-2">
                        <Field label={field.label} required={field.required} hint={field.description}>
                          <ContactSearchPicker
                            available={available}
                            selectedId={ec.contactId ?? ""}
                            onSelect={(id) => updateEmergency(i, { contactId: id === "" || id == null ? "" : String(id) })}
                          />
                        </Field>
                        {sel && (
                          <div className="rounded-lg bg-background border border-border px-3 py-2 text-xs space-y-0.5 text-foreground mt-2">
                            {sel.phones?.[0]?.number && <p className="text-muted-foreground">📞 {sel.phones[0].number}</p>}
                            {sel.emails?.[0]?.address && <p className="text-muted-foreground">✉️ {sel.emails[0].address}</p>}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (field.key === "relationship") {
                    return (
                      <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
                        <EditableSelect
                          options={relationships || []}
                          value={(ec.relationship as string) || ""}
                          onChange={(val) => updateEmergency(i, { relationship: val })}
                          onUpdateOptions={updateRelationships}
                          placeholder={t("contacts.form.selectOption")}
                          className="w-full"
                        />
                      </Field>
                    );
                  }

                  return (
                    <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
                      <CustomFieldInput
                        field={field}
                        value={ec[field.key]}
                        onChange={(val) => updateEmergency(i, { [field.key]: val })}
                      />
                    </Field>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}

      <button
        type="button"
        onClick={() => upd([...list, createNewEmergency()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmergencyContact")}</span>
      </button>
    </div>
  );
}

