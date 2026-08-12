import type { ChangeEvent, FormEvent, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Contact, type TabConfig } from "@mms/shared";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { DETAIL_SYSTEM_TAB_KEYS } from "@/tenant/features/contacts/components/detail/contactDetailStyles";
import { FieldGroupCard } from "@/tenant/features/contacts/components/detail/ContactDetailShared";
import { ContactDetailOverview } from "@/tenant/features/contacts/components/detail/ContactDetailOverview";
import { ContactDetailTimeline } from "@/tenant/features/contacts/components/detail/ContactDetailTimeline";
import { ContactDetailFiles } from "@/tenant/features/contacts/components/detail/ContactDetailFiles";
import { EmptyState } from "@/components/ui/EmptyState";
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
  dfsTabs?: TabConfig[];
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
  dfsTabs,
}: ContactDetailDrawerContentProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const dfsTab = dfsTabs?.find((t) => t.key === activeTab);
  const customTabFields = Object.entries(grouped)
    .map(([groupName, fieldsList]) => ({
      groupName,
      fields: fieldsList.filter((field) => field.tab === activeTab),
    }))
    .filter((entry) => entry.fields.length > 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        role="tabpanel"
        id={`contact-detail-drawer-${activeTab}`}
        aria-labelledby={`contact-detail-drawer-tab-${activeTab}`}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: reducedMotion ? 0 : 0.15 }}
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

        {/* DFS-managed custom tab — single source of truth for custom field tabs */}
        {dfsTab && (
          <div className="space-y-4">
            {dfsTab.fields.filter((f) => f.enabled).length === 0 ? (
              <EmptyState
                title={t("contacts.detail.emptyCustomTab")}
                compact
                icon={null}
                className="uppercase tracking-widest"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dfsTab.fields
                  .filter((f) => f.enabled)
                  .map((field) => {
                    const customData = (contactState.customData as Record<string, unknown> | undefined) || {};
                    const val = customData[field.key] ?? (contactState as Record<string, unknown>)[field.key];
                    return (
                      <div key={field.key} className="p-3 rounded-lg border border-border bg-card">
                        <div className="text-xs text-muted-foreground font-medium">{field.label}</div>
                        <div className="text-sm font-semibold mt-1">
                          {val !== undefined && val !== null && String(val) !== "" ? String(val) : "—"}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Legacy grouped-field fallback for non-DFS, non-system tabs */}
        {!dfsTab && !DETAIL_SYSTEM_TAB_KEYS.has(activeTab) && (
          <div className="space-y-4">
            {customTabFields.length === 0 ? (
              <EmptyState
                title={t("contacts.detail.emptyCustomTab")}
                compact
                icon={null}
                className="uppercase tracking-widest"
              />
            ) : (
              customTabFields.map(({ groupName, fields: groupFields }) => (
                <FieldGroupCard
                  key={groupName}
                  group={groupName}
                  fields={groupFields}
                  formatValue={formatFieldValue}
                  getRawValue={(key) =>
                    (contactState.customData as Record<string, unknown> | undefined)?.[key] ??
                    (contactState as Record<string, unknown>)[key]
                  }
                />
              ))
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
