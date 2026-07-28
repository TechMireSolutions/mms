import { useState, useEffect, useMemo, useId, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2, Clock, LayoutDashboard,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  Contact,
  ContactActivity,
  canViewContactField,
  CONTACTS_MODULE_MANIFEST,
  getPrimaryPhone,
  getPrimaryEmail,
  formatDate,
  todayISO,
} from "@mms/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatContactDobWithAge,
  formatContactGenderLabel,
  resolveRegistryLabel,
  resolveRegistryDescription,
} from "@/lib/contacts/contactI18n";
import { contactDetailQueryKey, fetchContactById } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactDetailAttachments } from "@/tenant/features/contacts/hooks/useContactDetailAttachments";
import { Button } from "@/components/ui/button";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { notify } from "@/lib/notify";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  ICON_MAP,
  DETAIL_SYSTEM_TAB_KEYS,
  DEFAULT_DETAIL_TAB_BY_KEY,
  DETAIL_STYLES,
  isEmptyValue,
} from "./detail/contactDetailStyles";
import { FieldGroupCard } from "./detail/ContactDetailShared";
import { ContactDetailOverview } from "./detail/ContactDetailOverview";
import { ContactDetailTimeline } from "./detail/ContactDetailTimeline";
import { ContactDetailNetwork } from "./detail/ContactDetailNetwork";
import { ContactDetailFiles } from "./detail/ContactDetailFiles";

interface ContactDetailDrawerProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  onUpdateContact?: (contact: Contact) => Promise<void>;
  canWrite?: boolean;
}

export default function ContactDetailDrawer({
  contact: initialContact,
  onClose,
  onEdit,
  onWhatsApp,
  onSms,
  onEmail,
  allContacts = [],
  onUpdateContact,
  canWrite = false,
}: ContactDetailDrawerProps): JSX.Element {
  const { enabledTabIds, isTabFieldEnabled, fieldConfig, fields } = useContactConfig();
  const { user } = useAuth();
  const { role } = usePermissions();
  const viewerRole = role ?? '';
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const noteInputId = useId();
  const [contactState, setContactState] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState<string>("");
  const canPersistContact = canWrite && Boolean(onUpdateContact);

  const {
    isDragging,
    setIsDragging,
    isUploading,
    pendingAttachmentDelete,
    setPendingAttachmentDelete,
    fileInputRef,
    handleFiles,
    handleFileChange,
    confirmAttachmentDelete,
  } = useContactDetailAttachments({
    contactState,
    setContactState,
    canPersistContact,
    onUpdateContact,
  });

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

  const [activeTab, setActiveTab] = useState<string>(() => {
    return detailTabs[0]?.key || "";
  });

  const heroFieldSet = useMemo(
    () => new Set<string>(CONTACTS_MODULE_MANIFEST.heroFieldKeys),
    [],
  );

  useEffect(() => {
    setContactState(initialContact);
    setActiveTab(detailTabs[0]?.key || "");
  }, [initialContact, detailTabs]);

  const allFields = useMemo(() => {
    return Object.entries(fields).flatMap(([tabId, tabFields]) =>
      (tabFields || [])
        .filter((field) => canViewContactField(viewerRole, field))
        .map((field) => ({
          key: field.key,
          label: resolveRegistryLabel(field, t),
          type: field.type,
          tab: tabId,
          group: field.group || t('contacts.detail.extendedProfiles'),
          description: resolveRegistryDescription(field, t),
        }))
    );
  }, [fields, t, viewerRole]);

  const visibleCollectionFields = useMemo(
    () => ({
      phones: (fields.phones || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      emails: (fields.emails || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      addresses: (fields.addresses || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      socials: (fields.socials || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      emergency: (fields.emergency || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
    }),
    [fields, viewerRole],
  );

  const combinedActivities = useMemo(() => {
    const noteActs = contactState.activities || [];
    return [...noteActs].sort((a, b) => (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime()));
  }, [contactState.activities]);

  const fieldsToRender = allFields.filter(
    (field) =>
      !heroFieldSet.has(field.key) &&
      isTabFieldEnabled(field.tab, field.key) &&
      !isEmptyValue(contactState[field.key])
  );

  const grouped = fieldsToRender.reduce<Record<string, typeof fieldsToRender>>((acc, field) => {
    const group = field.group || t('contacts.detail.otherGroup');
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  const formatFieldValue = useCallback((field: { key: string; type: string }): string | null => {
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
  }, [contactState, t]);

  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(contactState) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(contactState) : null;

  const handleAddNote = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (!trimmed || !canPersistContact || !onUpdateContact) return;

    const newActivity: ContactActivity = {
      id: `act-${crypto.randomUUID()}`,
      type: "note",
      content: trimmed,
      date: todayISO(),
      by: user?.name || t('contacts.detail.systemUser')
    };

    const prev = contactState;
    const updatedContact = { ...contactState, activities: [newActivity, ...(contactState.activities || [])] };

    setContactState(updatedContact);
    setNoteText("");

    try {
      await onUpdateContact(updatedContact);
    } catch {
      setContactState(prev);
      setNoteText(trimmed);
      notify.error(t('contacts.detail.noteSaveFailed'));
    }
  };

  const handleNavigateToContact = useCallback((targetId: string | number): void => {
    const target = allContacts.find((contact) => String(contact.id) === String(targetId));
    if (target) {
      setContactState(target);
      return;
    }
    const contactId = String(targetId);
    void queryClient
      .fetchQuery({
        queryKey: contactDetailQueryKey(contactId),
        queryFn: () => fetchContactById(contactId),
      })
      .then((contact) => {
        setContactState(contact);
      })
      .catch(() => {
        notify.error(t("contacts.detail.loadFailed"));
      });
  }, [allContacts, queryClient, t]);

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t('contacts.detail.title')}
      ariaLabel={t('contacts.detail.title')}
      headerActions={
        canWrite ? (
          <Button
            variant="outline"
            onClick={() => onEdit(contactState)}
            aria-label={t('contacts.detail.editProfile')}
            className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
            title={t('contacts.detail.editProfile')}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        ) : undefined
      }
      headerExtra={
        <div className="flex border-b border-border py-1 overflow-x-auto w-full">
          <SubTabBar
            tabs={detailTabs}
            value={activeTab}
            onChange={setActiveTab}
            panelIdPrefix="contact-detail-drawer"
            className="w-full"
          />
        </div>
      }
      footer={
        <>
          <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            {(contactState.updatedAt || contactState.createdAt) && (
              <span>{t('contacts.detail.updatedLabel')} {formatDate((contactState.updatedAt || contactState.createdAt) as string)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${DETAIL_STYLES.liveIntelIndicator}`} />
            <span className={`text-[9px] font-bold uppercase ${DETAIL_STYLES.liveIntelText}`}>{t('contacts.detail.liveIntel')}</span>
          </div>
        </>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {activeTab === "overview" && (
            <ContactDetailOverview
              contact={contactState}
              allContacts={allContacts}
              grouped={grouped}
              formatFieldValue={formatFieldValue}
              visibleCollectionFields={visibleCollectionFields}
              primaryPhone={primaryPhone}
              primaryEmail={primaryEmail}
              onWhatsApp={onWhatsApp}
              onSms={onSms}
              onEmail={onEmail}
              onNavigateToContact={handleNavigateToContact}
            />
          )}

          {activeTab === "timeline" && (
            <ContactDetailTimeline
              activities={combinedActivities}
              noteText={noteText}
              noteInputId={noteInputId}
              canPersistContact={canPersistContact}
              onNoteTextChange={setNoteText}
              onAddNote={handleAddNote}
            />
          )}

          {activeTab === "network" && (
            <ContactDetailNetwork
              contact={contactState}
              allContacts={allContacts}
              onNavigateToContact={handleNavigateToContact}
            />
          )}

          {activeTab === "files" && (
            <ContactDetailFiles
              contact={contactState}
              canPersistContact={canPersistContact}
              isDragging={isDragging}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              onDraggingChange={setIsDragging}
              onFiles={handleFiles}
              onFileChange={handleFileChange}
              onRequestDelete={setPendingAttachmentDelete}
            />
          )}

          {!DETAIL_SYSTEM_TAB_KEYS.has(activeTab) && (
            <div className="space-y-4">
              {Object.entries(grouped)
                .filter(([, fieldsList]) => fieldsList.some((field) => field.tab === activeTab))
                .map(([groupName, fieldsList]) => (
                  <FieldGroupCard
                    key={groupName}
                    group={groupName}
                    fields={fieldsList.filter((field) => field.tab === activeTab)}
                    formatValue={formatFieldValue}
                  />
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <ConfirmAlertDialog
        open={pendingAttachmentDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAttachmentDelete(null);
        }}
        title={t("contacts.detail.confirmDeleteAttachmentTitle")}
        description={t("contacts.detail.confirmDeleteAttachmentDescription", {
          name: pendingAttachmentDelete?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          void confirmAttachmentDelete();
        }}
        destructive
      />
    </DetailDrawerShell>
  );
}
