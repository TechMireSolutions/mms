import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactDetailAttachments } from "@/tenant/features/contacts/hooks/useContactDetailAttachments";
import { useContactDetailViewModel } from "@/tenant/features/contacts/hooks/useContactDetailViewModel";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ContactDetailDrawerContent } from "./detail/ContactDetailDrawerContent";
import {
  ContactDetailDrawerFooter,
  ContactDetailDrawerHeaderActions,
  ContactDetailDrawerTabBar,
} from "./detail/ContactDetailDrawerChrome";

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
        <ContactDetailDrawerHeaderActions
          canWrite={canWrite}
          contact={contactState}
          onEdit={onEdit}
        />
      }
      headerExtra={
        <ContactDetailDrawerTabBar
          detailTabs={detailTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
      footer={<ContactDetailDrawerFooter contact={contactState} />}
    >
      <ContactDetailDrawerContent
        activeTab={activeTab}
        contactState={contactState}
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
        activities={combinedActivities}
        noteText={noteText}
        noteInputId={noteInputId}
        canPersistContact={canPersistContact}
        onNoteTextChange={setNoteText}
        onAddNote={handleAddNote}
        isDragging={isDragging}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        onDraggingChange={setIsDragging}
        onFiles={handleFiles}
        onFileChange={handleFileChange}
        onRequestDelete={setPendingAttachmentDelete}
      />
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
