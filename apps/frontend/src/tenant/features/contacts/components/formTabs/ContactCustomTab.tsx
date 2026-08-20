import React from "react";
import { FolderKanban, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import {
  isContactCustomCollectionTab,
  type Contact,
  type FieldDefinition,
} from "@mms/shared";
import { ListFieldCard, ContactSubListShell } from "./ContactSubListCards";
import type { AddSubListItem, EnsureSubListItem, RemoveSubListItem, UpdateSubListItem } from "./types";
import { readContactCustomCollectionRows, type CustomCollectionRow } from "../contactCustomCollectionRows";

export interface ContactCustomTabProps {
  tabKey: string;
  tabLabel?: string;
  contactDraft: Partial<Contact>;
  fields: Record<string, FieldDefinition[]>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  addSubListItem: AddSubListItem;
  ensureSubListItem: EnsureSubListItem;
  updateSubListItem: UpdateSubListItem;
  removeSubListItem: RemoveSubListItem;
  getLocalId: (tabName: string, idx: number) => string;
}

/**
 * Universal dynamic custom tab renderer for ContactForm:
 * Supports custom collection tabs (custom_*) and scalar custom tabs (custom).
 */
export function ContactCustomTab({
  tabKey,
  tabLabel,
  contactDraft,
  fields,
  formInstanceId,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  getListItemError,
  updateDraft,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
  getLocalId,
}: ContactCustomTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const isCollection = isContactCustomCollectionTab(tabKey);
  const tabFields = (fields[tabKey] ?? []).filter(
    (field) => field.enabled && isFieldEnabled(tabKey, field.key),
  );

  if (isCollection) {
    const rows = readContactCustomCollectionRows(contactDraft, tabKey);
    const emptyRow = (): CustomCollectionRow =>
      tabFields.reduce<CustomCollectionRow>((acc, f) => {
        acc[f.key] = f.defaultValue ?? "";
        return acc;
      }, {});

    return (
      <ContactSubListShell
        isEmpty={rows.length === 0}
        emptyIcon={FolderKanban}
        emptyMessage={t("contacts.form.noCustomTabEntriesYet")}
        addLabel={t("contacts.form.addCustomTabEntry")}
        onAdd={() => addSubListItem(tabKey, emptyRow())}
        onEnsureRow={() => ensureSubListItem(tabKey, emptyRow())}
        allowAdd={tabFields.length > 0}
      >
        <AnimatePresence initial={false}>
          {rows.map((row, idx) => {
            const entryLabel = t("contacts.form.customTabEntryLabel", { index: idx + 1 });
            return (
              <ListFieldCard
                key={getLocalId(tabKey, idx)}
                id={getLocalId(tabKey, idx)}
                index={idx}
                icon={FolderKanban}
                accentClass="bg-primary/60 group-hover:bg-primary"
                iconClass="text-primary group-hover:text-primary"
                label={entryLabel}
                onRemove={() => removeSubListItem(tabKey, idx)}
                removeLabel={t("common.delete")}
              >
                <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                  {tabFields.map((field) => {
                    const fieldError = getListItemError(tabKey, field.key, idx);
                    const required = isFieldRequired(tabKey, field.key);
                    const label = resolveRegistryLabel(field, t);
                    const val = row[field.key];
                    return (
                      <Field
                        key={field.key}
                        label={label}
                        required={required}
                        error={fieldError}
                        id={`cf-${formInstanceId}-${tabKey}-${idx}-${field.key}`}
                      >
                        <CustomFieldInput
                          field={field}
                          value={val}
                          onChange={(newVal) =>
                            updateSubListItem(tabKey, idx, { [field.key]: newVal })
                          }
                          error={Boolean(fieldError)}
                        />
                      </Field>
                    );
                  })}
                </div>
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </ContactSubListShell>
    );
  }

  // Scalar custom tab
  if (tabFields.length === 0) {
    return (
      <EmptyState
        variant="dashed"
        icon={Sparkles}
        title={t("contacts.form.customTabEmpty")}
        compact
      />
    );
  }

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={tabLabel} icon={FolderKanban} accentColor="primary">
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
          {tabFields.map((field) => {
            const error = getFieldError(field.key);
            const required = isFieldRequired(tabKey, field.key);
            const label = resolveRegistryLabel(field, t);
            const value = (contactDraft as Record<string, unknown>)[field.key];
            return (
              <Field
                key={field.key}
                label={label}
                required={required}
                error={error}
                id={`cf-${formInstanceId}-${tabKey}-${field.key}`}
              >
                <CustomFieldInput
                  field={field}
                  value={value}
                  onChange={(val) => updateDraft({ [field.key]: val })}
                  error={Boolean(error)}
                />
              </Field>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
