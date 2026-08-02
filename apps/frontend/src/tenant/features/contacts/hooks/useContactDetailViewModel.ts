import { useEffect, useId, useMemo, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  Contact,
  getPrimaryPhone,
  getPrimaryEmail,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ICON_MAP,
  DETAIL_SYSTEM_TAB_KEYS,
  DEFAULT_DETAIL_TAB_BY_KEY,
} from "@/tenant/features/contacts/components/detail/contactDetailStyles";
import { useContactDetailActions } from "@/tenant/features/contacts/hooks/useContactDetailActions";
import { useContactDetailFields } from "@/tenant/features/contacts/hooks/useContactDetailFields";

export type { DetailFieldView } from "@/tenant/features/contacts/hooks/useContactDetailFields";

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
  const isArchived = Boolean(contactState.deletedAt ?? initialContact.deletedAt);
  const canPersistContact = canWrite && Boolean(onUpdateContact) && !isArchived;

  const detailTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.detailTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter(
        (tab) =>
          tab.key !== "network" &&
          tab.enabled &&
          (DETAIL_SYSTEM_TAB_KEYS.has(tab.key) || enabledTabIds.has(tab.key)),
      );

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

  useEffect(() => {
    setContactState(initialContact);
    setActiveTab(detailTabs[0]?.key || "");
  }, [initialContact, detailTabs]);

  const combinedActivities = useMemo(() => {
    const noteActs = contactState.activities || [];
    return [...noteActs].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [contactState.activities]);

  const { grouped, formatFieldValue, visibleCollectionFields } = useContactDetailFields({
    fields,
    viewerRole,
    contactState,
    isTabFieldEnabled,
    t,
  });

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
