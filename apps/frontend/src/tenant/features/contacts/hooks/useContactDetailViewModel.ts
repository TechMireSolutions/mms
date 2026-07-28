import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  Contact,
  canViewContactField,
  CONTACTS_MODULE_MANIFEST,
  getPrimaryPhone,
  getPrimaryEmail,
  type FieldDefinition,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatContactDobWithAge,
  formatContactGenderLabel,
  resolveRegistryLabel,
  resolveRegistryDescription,
} from "@/lib/contacts/contactI18n";
import {
  ICON_MAP,
  DETAIL_SYSTEM_TAB_KEYS,
  DEFAULT_DETAIL_TAB_BY_KEY,
  isEmptyValue,
} from "@/tenant/features/contacts/components/detail/contactDetailStyles";
import { useContactDetailActions } from "@/tenant/features/contacts/hooks/useContactDetailActions";

export type DetailFieldView = {
  key: string;
  label: string;
  type: string;
  tab: string;
  group: string;
  description: string;
};

export function useContactDetailViewModel({
  initialContact,
  allContacts,
  onUpdateContact,
  canWrite,
}: {
  initialContact: Contact;
  allContacts: Contact[];
  onUpdateContact?: (contact: Contact) => Promise<void>;
  canWrite: boolean;
}) {
  const { enabledTabIds, isTabFieldEnabled, fieldConfig, fields } = useContactConfig();
  const { role } = usePermissions();
  const viewerRole = role ?? "";
  const { t } = useTranslation();
  const noteInputId = useId();
  const [contactState, setContactState] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState("");
  const canPersistContact = canWrite && Boolean(onUpdateContact);

  const detailTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.detailTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tab) => tab.enabled && (DETAIL_SYSTEM_TAB_KEYS.has(tab.key) || enabledTabIds.has(tab.key)));

    return sorted.map((tab) => {
      const defaultTab = DEFAULT_DETAIL_TAB_BY_KEY.get(tab.key);
      const labelKey = tab.labelKey ?? defaultTab?.labelKey;
      return {
        key: tab.key,
        label: labelKey ? t(labelKey) : tab.label,
        icon: ICON_MAP[tab.icon || tab.key] || LayoutDashboard,
      };
    });
  }, [fieldConfig.detailTabs, enabledTabIds, t]);

  const [activeTab, setActiveTab] = useState<string>(() => detailTabs[0]?.key || "");

  const heroFieldSet = useMemo(
    () => new Set<string>(CONTACTS_MODULE_MANIFEST.heroFieldKeys),
    [],
  );

  useEffect(() => {
    setContactState(initialContact);
    setActiveTab(detailTabs[0]?.key || "");
  }, [initialContact, detailTabs]);

  const allFields = useMemo((): DetailFieldView[] => {
    return Object.entries(fields).flatMap(([tabId, tabFields]) =>
      (tabFields || [])
        .filter((field) => canViewContactField(viewerRole, field))
        .map((field) => ({
          key: field.key,
          label: resolveRegistryLabel(field, t),
          type: field.type,
          tab: tabId,
          group: field.group || t("contacts.detail.extendedProfiles"),
          description: resolveRegistryDescription(field, t),
        })),
    );
  }, [fields, t, viewerRole]);

  const visibleCollectionFields = useMemo(
    () => ({
      phones: filterVisibleCollection(fields.phones, viewerRole),
      emails: filterVisibleCollection(fields.emails, viewerRole),
      addresses: filterVisibleCollection(fields.addresses, viewerRole),
      socials: filterVisibleCollection(fields.socials, viewerRole),
      emergency: filterVisibleCollection(fields.emergency, viewerRole),
    }),
    [fields, viewerRole],
  );

  const combinedActivities = useMemo(() => {
    const noteActs = contactState.activities || [];
    return [...noteActs].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [contactState.activities]);

  const fieldsToRender = allFields.filter(
    (field) =>
      !heroFieldSet.has(field.key) &&
      isTabFieldEnabled(field.tab, field.key) &&
      !isEmptyValue(contactState[field.key]),
  );

  const grouped = fieldsToRender.reduce<Record<string, DetailFieldView[]>>((acc, field) => {
    const group = field.group || t("contacts.detail.otherGroup");
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  const formatFieldValue = useCallback(
    (field: { key: string; type: string }): string | null => {
      const fieldValue = (contactState as Record<string, unknown>)[field.key];
      if (isEmptyValue(fieldValue)) return null;
      if (Array.isArray(fieldValue)) return fieldValue.join(", ");
      if (field.key === "dob") {
        return formatContactDobWithAge(fieldValue as string, t);
      }
      if (field.key === "gender") {
        return formatContactGenderLabel(fieldValue as string, t);
      }
      return String(fieldValue);
    },
    [contactState, t],
  );

  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(contactState) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(contactState) : null;

  const { handleAddNote, handleNavigateToContact } = useContactDetailActions({
    allContacts,
    contactState,
    setContactState,
    noteText,
    setNoteText,
    canPersistContact,
    onUpdateContact,
  });

  return {
    contactState,
    setContactState,
    noteText,
    setNoteText,
    noteInputId,
    canPersistContact,
    detailTabs,
    activeTab,
    setActiveTab,
    grouped,
    formatFieldValue,
    visibleCollectionFields,
    combinedActivities,
    primaryPhone,
    primaryEmail,
    handleAddNote,
    handleNavigateToContact,
  };
}

function filterVisibleCollection(
  tabFields: FieldDefinition[] | undefined,
  viewerRole: string,
): FieldDefinition[] {
  return (tabFields || []).filter(
    (field) => field.enabled && canViewContactField(viewerRole, field),
  );
}
