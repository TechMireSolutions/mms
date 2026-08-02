import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import type { Contact, StandardMessagingRecipient } from "@mms/shared";
import {
  ContactsPageConfirmDialogs,
} from "@/tenant/features/contacts/components/ContactsPageConfirmDialogs";
import { Skeleton } from "@/components/ui/skeleton";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));
const DuplicateDetection = lazy(() => import("@/tenant/features/contacts/components/DuplicateDetection"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));

export interface ContactsPageOverlaysProps {
  canWrite: boolean;
  canDelete: boolean;
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
  onRestoreFromDrawer?: (contactId: string | number) => void;
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
  canDelete,
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
  onRestoreFromDrawer,
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
        </AnimatePresence>
      </Suspense>

      {viewContact && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 flex items-center justify-end bg-black/20"
              role="status"
              aria-live="polite"
            >
              <div className="flex h-full w-full max-w-full flex-col gap-3 border-s border-border bg-card p-5 sm:max-w-sm">
                <Skeleton className="h-5 w-2/3 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            </div>
          }
        >
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
            canDelete={canDelete}
            onRestore={onRestoreFromDrawer}
          />
        </Suspense>
      )}

      <ContactsPageConfirmDialogs
        bulkDeleteOpen={bulkDeleteOpen}
        onBulkDeleteOpenChange={onBulkDeleteOpenChange}
        selectedCount={selectedCount}
        onConfirmBulkDelete={onConfirmBulkDelete}
        deleteTarget={deleteTarget}
        onDeleteTargetOpenChange={onDeleteTargetOpenChange}
        onConfirmSingleDelete={onConfirmSingleDelete}
        bulkRestoreOpen={bulkRestoreOpen}
        onBulkRestoreOpenChange={onBulkRestoreOpenChange}
        onConfirmBulkRestore={onConfirmBulkRestore}
      />
    </>
  );
}
