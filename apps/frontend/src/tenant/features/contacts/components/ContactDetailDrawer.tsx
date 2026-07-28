import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Clock } from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Contact, formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactDetailAttachments } from "@/tenant/features/contacts/hooks/useContactDetailAttachments";
import { useContactDetailViewModel } from "@/tenant/features/contacts/hooks/useContactDetailViewModel";
import { Button } from "@/components/ui/button";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  DETAIL_SYSTEM_TAB_KEYS,
  DETAIL_STYLES,
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
  const { t } = useTranslation();

  const {
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
  } = useContactDetailViewModel({
    initialContact,
    allContacts,
    onUpdateContact,
    canWrite,
  });

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

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t("contacts.detail.title")}
      ariaLabel={t("contacts.detail.title")}
      headerActions={
        canWrite ? (
          <Button
            variant="outline"
            onClick={() => onEdit(contactState)}
            aria-label={t("contacts.detail.editProfile")}
            className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
            title={t("contacts.detail.editProfile")}
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
              <span>
                {t("contacts.detail.updatedLabel")}{" "}
                {formatDate((contactState.updatedAt || contactState.createdAt) as string)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${DETAIL_STYLES.liveIntelIndicator}`} />
            <span className={`text-[9px] font-bold uppercase ${DETAIL_STYLES.liveIntelText}`}>
              {t("contacts.detail.liveIntel")}
            </span>
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
