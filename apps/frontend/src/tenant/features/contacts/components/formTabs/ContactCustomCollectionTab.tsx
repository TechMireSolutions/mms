import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import {
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
} from "@mms/shared";
import { ListFieldCard, ContactSubListShell } from "./ContactSubListCards";

type CustomCollectionRow = Record<string, unknown>;

function readRows(contactDraft: Partial<Contact>, tabId: string): CustomCollectionRow[] {
  const value = contactDraft[tabId];
  return Array.isArray(value) ? (value as CustomCollectionRow[]) : [];
}

function emptyRow(fields: FieldDefinition[]): CustomCollectionRow {
  const row: CustomCollectionRow = {};
  for (const field of fields) {
    row[field.key] = field.defaultValue ?? (field.type === "boolean" ? false : "");
  }
  return row;
}

/** Tenant-created Setup tabs — multi-entry rows like Phones / Emails. */
export function ContactCustomCollectionTab({
  contactDraft,
  formInstanceId,
  fields,
  tabId,
  getLocalId,
  getListItemError,
  updateDraft,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  tabId: string;
  getLocalId: (tabName: string, idx: number) => string;
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const rowFields = listEnabledCustomContactFormFields(fields, tabId);
  const rows = readRows(contactDraft, tabId);

  const setRows = (next: CustomCollectionRow[]) => {
    updateDraft({ [tabId]: next } as Partial<Contact>);
  };

  if (rowFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("contacts.form.customFieldsEmpty")}
      </p>
    );
  }

  return (
    <ContactSubListShell
      isEmpty={rows.length === 0}
      emptyIcon={SlidersHorizontal}
      emptyMessage={t("contacts.form.noCustomTabEntriesYet")}
      addLabel={t("contacts.form.addCustomTabEntry")}
      onAdd={() => setRows([...rows, emptyRow(rowFields)])}
      onEnsureRow={() => {
        if (rows.length === 0) setRows([emptyRow(rowFields)]);
      }}
    >
      <AnimatePresence initial={false}>
        {rows.map((row, idx) => (
          <ListFieldCard
            key={getLocalId(tabId, idx)}
            id={getLocalId(tabId, idx)}
            index={idx}
            icon={SlidersHorizontal}
            accentClass="bg-primary/60 group-hover:bg-primary"
            iconClass="text-primary/70 group-hover:text-primary"
            label={t("contacts.form.customTabEntryLabel", { index: idx + 1 })}
            onRemove={() => setRows(rows.filter((_, i) => i !== idx))}
            removeLabel={t("contacts.form.removeCustomTabEntry", { index: idx + 1 })}
          >
            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
              {rowFields.map((field) => {
                const fieldId = `cf-${formInstanceId}-${tabId}-${idx}-${field.key}`;
                const error = getListItemError(tabId, field.key, idx);
                const inputField: FieldDefinition = { ...field, key: fieldId };
                return (
                  <div
                    key={field.key}
                    className={
                      field.type === "textarea" || field.type === "tags"
                        ? "@md:col-span-2"
                        : undefined
                    }
                  >
                    <Field
                      label={resolveRegistryLabel(field, t)}
                      required={field.required}
                      error={error}
                      id={fieldId}
                    >
                      <CustomFieldInput
                        field={inputField}
                        value={row[field.key]}
                        onChange={(nextValue) => {
                          setRows(
                            rows.map((entry, entryIndex) =>
                              entryIndex === idx
                                ? { ...entry, [field.key]: nextValue }
                                : entry,
                            ),
                          );
                        }}
                        error={Boolean(error)}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          </ListFieldCard>
        ))}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
