import {
  isContactCustomCollectionTab,
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
  type TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";
import { isEmptyValue } from "./contactDetailStyles";
import { readContactCustomCollectionRows } from "../contactCustomCollectionRows";
import React from "react";

function formatCellValue(value: unknown, t: any): string | null {
  if (isEmptyValue(value)) return null;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? t("common.yes") : t("common.no");
  return String(value);
}

function formatRowSummary(
  row: Record<string, unknown>,
  rowFields: readonly FieldDefinition[],
  resolveLabel: (field: FieldDefinition) => string,
  t: any,
): string {
  return rowFields
    .map((field) => {
      const cell = formatCellValue(row[field.key], t);
      if (!cell) return null;
      return `${resolveLabel(field)}: ${cell}`;
    })
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function resolveCustomCollectionTabs(
  formTabs: TabDefinition[] | undefined,
  fields: Record<string, FieldDefinition[]>,
  enabledTabIds: Set<string>,
  onlyTabId?: string,
): TabDefinition[] {
  const fromConfig = (formTabs ?? []).filter(
    (tab) =>
      isContactCustomCollectionTab(tab.key) &&
      tab.enabled !== false &&
      enabledTabIds.has(tab.key) &&
      (onlyTabId == null || tab.key === onlyTabId),
  );

  if (fromConfig.length > 0) {
    return fromConfig.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  }

  // Fallback when formTabs lag hydrate: still render an enabled custom_* tab with fields.
  if (onlyTabId && isContactCustomCollectionTab(onlyTabId) && enabledTabIds.has(onlyTabId)) {
    const rowFields = listEnabledCustomContactFormFields(fields, onlyTabId);
    if (rowFields.length > 0) {
      return [{ key: onlyTabId, label: onlyTabId, enabled: true, order: 0 }];
    }
  }

  return Object.keys(fields)
    .filter(
      (tabId) =>
        isContactCustomCollectionTab(tabId) &&
        enabledTabIds.has(tabId) &&
        (onlyTabId == null || tabId === onlyTabId) &&
        listEnabledCustomContactFormFields(fields, tabId).length > 0,
    )
    .map((tabId) => ({ key: tabId, label: tabId, enabled: true, order: 0 }));
}

export function ContactDetailCustomCollections({
  contact,
  fields,
  enabledTabIds,
  formTabs,
  onlyTabId,
}: {
  contact: Contact;
  fields: Record<string, FieldDefinition[]>;
  enabledTabIds: Set<string>;
  formTabs?: TabDefinition[];
  /** When set, only that tab section is rendered (drawer tab panel). */
  onlyTabId?: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const tabs = resolveCustomCollectionTabs(formTabs, fields, enabledTabIds, onlyTabId);

  if (tabs.length === 0) return null;

  return (
    <>
      {tabs.map((tab) => {
        const rowFields = listEnabledCustomContactFormFields(fields, tab.key);
        if (rowFields.length === 0) return null;

        const rows = readContactCustomCollectionRows(contact, tab.key);
        const title = tab.labelKey ? t(tab.labelKey) : tab.label || tab.key;

        return (
          <DetailSection key={tab.key} title={title}>
            {rows.length === 0 ? (
              <DetailCollectionEmpty title={t("contacts.form.noCustomTabEntriesYet")} />
            ) : (
              rows.map((row, rowIndex) => {
                const summary = formatRowSummary(row, rowFields, (field) =>
                  resolveRegistryLabel(field, t),
                  t
                );
                if (!summary) return null;
                return (
                  <CollectionRowItem
                    key={`${tab.key}-${rowIndex}`}
                    label={t("contacts.form.customTabEntryLabel", { index: rowIndex + 1 })}
                    value={summary}
                  />
                );
              })
            )}
          </DetailSection>
        );
      })}
    </>
  );
}
