import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import type { Contact, StandardMessagingRecipient } from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));
const DuplicateDetection = lazy(() => import("@/tenant/features/contacts/components/DuplicateDetection"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));

export interface ContactsPageOverlaysProps {
  canWrite: boolean;
  showForm: boolean;
  editContact: Contact | null;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  onCloseForm: () => void;
  onSave: (contact: Contact) => void | Promise<void>;
  showDuplicates: boolean;
  onCloseDuplicates: () => void;
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => Promise<void>;
  messagingTarget: { channel: "whatsapp" | "sms" | "email"; recipients: StandardMessagingRecipient[] } | null;
  onCloseComposer: () => void;
  viewContact: Contact | null;
  onCloseView: () => void;
  onEditFromDrawer: (contact: Contact) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  allContactsForLinks: Contact[];
  onUpdateContact?: (contact: Contact) => Promise<void>;
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmBulkDelete: (reason?: string) => void;
  deleteTarget: { id: string | number; name?: string } | null;
  onDeleteTargetOpenChange: (open: boolean) => void;
  onConfirmSingleDelete: (reason?: string) => void;
  bulkRestoreOpen: boolean;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => void;
}

/** Lazy form/drawer/composer + confirm dialogs for Contacts page. */
export function ContactsPageOverlays({
  canWrite,
  showForm,
  editContact,
  defaultCountry,
  defaultCity,
  defaultProvince,
  onCloseForm,
  onSave,
  showDuplicates,
  onCloseDuplicates,
  onMerge,
  messagingTarget,
  onCloseComposer,
  viewContact,
  onCloseView,
  onEditFromDrawer,
  onWhatsApp,
  onSms,
  onEmail,
  allContactsForLinks,
  onUpdateContact,
  bulkDeleteOpen,
  onBulkDeleteOpenChange,
  selectedCount,
  onConfirmBulkDelete,
  deleteTarget,
  onDeleteTargetOpenChange,
  onConfirmSingleDelete,
  bulkRestoreOpen,
  onBulkRestoreOpenChange,
  onConfirmBulkRestore,
}: ContactsPageOverlaysProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Suspense fallback={null}>
        <AnimatePresence>
          <ContactForm
            open={showForm}
            key={editContact?.id || "new"}
            contact={editContact ?? undefined}
            defaultCountry={defaultCountry}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            onClose={onCloseForm}
            onSave={onSave}
          />
          {showDuplicates && (
            <DuplicateDetection
              onClose={onCloseDuplicates}
              onMerge={onMerge}
              canWrite={canWrite}
            />
          )}
          {messagingTarget && (
            <MessageComposer
              channel={messagingTarget.channel}
              recipients={messagingTarget.recipients}
              onClose={onCloseComposer}
            />
          )}
          {viewContact && (
            <ContactDetailDrawer
              contact={viewContact}
              onClose={onCloseView}
              onEdit={onEditFromDrawer}
              onWhatsApp={onWhatsApp}
              onSms={onSms}
              onEmail={onEmail}
              allContacts={allContactsForLinks}
              onUpdateContact={onUpdateContact}
              canWrite={canWrite}
            />
          )}
        </AnimatePresence>
      </Suspense>

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={onBulkDeleteOpenChange}
        title={t("contacts.bulkDelete")}
        description={t("contacts.bulkDeleteConfirm", { count: selectedCount })}
        confirmLabel={t("common.delete")}
        onConfirm={onConfirmBulkDelete}
        destructive
        optionalReason={{
          label: t("contacts.deletionReasonLabel"),
          placeholder: t("contacts.deletionReasonPlaceholder"),
        }}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={onDeleteTargetOpenChange}
        title={t("contacts.deleteConfirmTitle")}
        description={
          deleteTarget?.name
            ? t("contacts.deleteConfirmDescription", { name: deleteTarget.name })
            : t("contacts.deleteConfirmDescriptionDefault")
        }
        confirmLabel={t("common.delete")}
        onConfirm={onConfirmSingleDelete}
        destructive
        optionalReason={{
          label: t("contacts.deletionReasonLabel"),
          placeholder: t("contacts.deletionReasonPlaceholder"),
        }}
      />
      <ConfirmAlertDialog
        open={bulkRestoreOpen}
        onOpenChange={onBulkRestoreOpenChange}
        title={t("contacts.bulkRestore")}
        description={t("contacts.bulkRestoreConfirm", { count: selectedCount })}
        confirmLabel={t("contacts.restoreContact")}
        onConfirm={onConfirmBulkRestore}
      />
    </>
  );
}
