import type { ChangeEvent, FormEvent, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Contact } from "@mms/shared";
import { DETAIL_SYSTEM_TAB_KEYS } from "@/tenant/features/contacts/components/detail/contactDetailStyles";
import { FieldGroupCard } from "@/tenant/features/contacts/components/detail/ContactDetailShared";
import { ContactDetailOverview } from "@/tenant/features/contacts/components/detail/ContactDetailOverview";
import { ContactDetailTimeline } from "@/tenant/features/contacts/components/detail/ContactDetailTimeline";
import { ContactDetailNetwork } from "@/tenant/features/contacts/components/detail/ContactDetailNetwork";
import { ContactDetailFiles } from "@/tenant/features/contacts/components/detail/ContactDetailFiles";
import type { DetailFieldView } from "@/tenant/features/contacts/hooks/useContactDetailViewModel";

interface ContactDetailDrawerContentProps {
  activeTab: string;
  contactState: Contact;
  allContacts: Contact[];
  grouped: Record<string, DetailFieldView[]>;
  formatFieldValue: (field: { key: string; type: string }) => string | null;
  visibleCollectionFields: {
    phones: { enabled?: boolean }[];
    emails: { enabled?: boolean }[];
    addresses: { enabled?: boolean }[];
    socials: { enabled?: boolean }[];
    relationship: { enabled?: boolean }[];
  };
  primaryPhone: string | null;
  primaryEmail: string | null;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  onNavigateToContact: (targetId: string | number) => void;
  activities: Contact["activities"];
  noteText: string;
  noteInputId: string;
  canPersistContact: boolean;
  onNoteTextChange: (value: string) => void;
  onAddNote: (event: FormEvent) => Promise<void>;
  isDragging: boolean;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDraggingChange: (next: boolean) => void;
  onFiles: (filesList: FileList | null) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRequestDelete: (attachment: { id: string; name: string }) => void;
}

export function ContactDetailDrawerContent({
  activeTab,
  contactState,
  allContacts,
  grouped,
  formatFieldValue,
  visibleCollectionFields,
  primaryPhone,
  primaryEmail,
  onWhatsApp,
  onSms,
  onEmail,
  onNavigateToContact,
  activities,
  noteText,
  noteInputId,
  canPersistContact,
  onNoteTextChange,
  onAddNote,
  isDragging,
  isUploading,
  fileInputRef,
  onDraggingChange,
  onFiles,
  onFileChange,
  onRequestDelete,
}: ContactDetailDrawerContentProps): JSX.Element {
  return (
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
            onNavigateToContact={onNavigateToContact}
          />
        )}

        {activeTab === "timeline" && (
          <ContactDetailTimeline
            activities={activities || []}
            noteText={noteText}
            noteInputId={noteInputId}
            canPersistContact={canPersistContact}
            onNoteTextChange={onNoteTextChange}
            onAddNote={onAddNote}
          />
        )}

        {activeTab === "network" && (
          <ContactDetailNetwork
            contact={contactState}
            allContacts={allContacts}
            onNavigateToContact={onNavigateToContact}
          />
        )}

        {activeTab === "files" && (
          <ContactDetailFiles
            contact={contactState}
            canPersistContact={canPersistContact}
            isDragging={isDragging}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            onDraggingChange={onDraggingChange}
            onFiles={onFiles}
            onFileChange={onFileChange}
            onRequestDelete={onRequestDelete}
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
  );
}
