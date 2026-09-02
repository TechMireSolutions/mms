import { useEffect, useId, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  type Contact,
  getPrimaryPhone,
  getPrimaryEmail,
  isContactCustomCollectionTab,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ICON_MAP,
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
  const { enabledTabIds, isTabFieldEnabled, fields, formTabs } = useContactConfig();
  const { role } = usePermissions();
  const viewerRole = role ?? "";
  const { t } = useTranslation();
  const noteInputId = useId();
  const [contactState, setContactState] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState("");
  const isArchived = Boolean(contactState.deletedAt ?? initialContact.deletedAt);
  const canPersistContact = canWrite && Boolean(onUpdateContact) && !isArchived;

  const detailTabs = (() => {
    const systemTabs = Array.from(DEFAULT_DETAIL_TAB_BY_KEY.values()).map((tab) => ({
      key: tab.key,
      label: tab.labelKey ? t(tab.labelKey) : tab.label,
      icon: ICON_MAP[tab.icon || tab.key] || LayoutDashboard,
    }));

    const customTabs = (formTabs || [])
      .filter((tab) => tab.enabled !== false && isContactCustomCollectionTab(tab.key) && enabledTabIds.has(tab.key))
      .map((tab) => ({
        key: tab.key,
        label: tab.labelKey ? t(tab.labelKey) : tab.label || tab.key,
        icon: LayoutDashboard, // fallback icon for custom tabs
      }));

    return [...systemTabs, ...customTabs];
  })();

  const [activeTab, setActiveTab] = useState<string>(() => detailTabs[0]?.key || "");

  useEffect(() => {
    setContactState(initialContact);
  }, [initialContact]);

  useEffect(() => {
    setActiveTab((currentTab) => {
      const tabExists = detailTabs.some((t) => t.key === currentTab);
      if (!currentTab || !tabExists) {
        return detailTabs[0]?.key || "";
      }
      return currentTab;
    });
  }, [initialContact.id, detailTabs]);

  const combinedActivities = (() => {
    const noteActs = contactState.activities || [];
    return [...noteActs].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  })();

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


