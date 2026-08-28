import React, { useState } from "react";
import { Users, Tag } from "lucide-react";
import type { Contact } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { Button } from "@/components/ui/button";
import type { BulkSelectionMessageChannel } from "@/components/ui/BulkSelectionActions";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactsBulkTagModal } from "@/tenant/features/contacts/components/ContactsBulkTagModal";

export interface ContactsBulkActionBarProps {
  selectedCount: number;
  viewingDeleted: boolean;
  bulkActions: readonly string[];
  canWriteMessaging: boolean;
  canExport: boolean;
  canDelete: boolean;
  canWrite?: boolean;
  selectedTargets: {
    waTargets: Contact[];
    smsReady: Contact[];
    emailReady: Contact[];
  };
  onWhatsApp: (targets: Contact[]) => void;
  onSms: (targets: Contact[]) => void;
  onEmail: (targets: Contact[]) => void;
  onBulkExport: () => void | Promise<void>;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  onBulkTag?: (tags: string[]) => Promise<void> | void;
  isTagPending?: boolean;
}

export function ContactsBulkActionBar({
  selectedCount,
  viewingDeleted,
  bulkActions,
  canWriteMessaging,
  canExport,
  canDelete,
  canWrite,
  selectedTargets,
  onWhatsApp,
  onSms,
  onEmail,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  onBulkTag,
  isTagPending,
}: ContactsBulkActionBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const showWhatsApp = bulkActions.includes("whatsapp") && canWriteMessaging;
  const showSms = bulkActions.includes("sms") && canWriteMessaging;
  const showEmail = bulkActions.includes("email") && canWriteMessaging;
  const showMessaging = !viewingDeleted && (showWhatsApp || showSms || showEmail);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === "whatsapp") onWhatsApp(selectedTargets.waTargets);
    else if (channel === "sms") onSms(selectedTargets.smsReady);
    else if (channel === "email") onEmail(selectedTargets.emailReady);
  };

  return (
    <>
      <ModuleWorkBulkActionBar
        selectedCount={selectedCount}
        viewingDeleted={viewingDeleted}
        countLabel={t("contacts.selectedCount", { count: selectedCount })}
        leading={<Users className="w-4 h-4 text-primary" aria-hidden />}
        deselectLabel={t("common.deselect")}
        canDelete={canDelete}
        restoreLabel={t("contacts.bulkRestore")}
        onRequestBulkRestore={onRequestBulkRestore}
        onClearSelection={onClearSelection}
        messaging={
          showMessaging
            ? {
                onChannel: handleChannel,
                labels: {
                  whatsapp: t("contacts.whatsappBulk", {
                    count: selectedTargets.waTargets.length,
                  }),
                  sms: t("contacts.smsBulk", { count: selectedTargets.smsReady.length }),
                  email: t("contacts.emailBulk", { count: selectedTargets.emailReady.length }),
                },
                channels: {
                  whatsapp: showWhatsApp,
                  sms: showSms,
                  email: showEmail,
                },
              }
            : undefined
        }
        exportAction={
          bulkActions.includes("export") && canExport
            ? { label: t("contacts.bulkExport"), onClick: onBulkExport }
            : undefined
        }
        extraActions={
          !viewingDeleted && canWrite && onBulkTag ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagModalOpen(true)}
              className="min-h-11 gap-1.5 px-3 font-medium text-xs border-border/60 hover:bg-muted/80"
            >
              <Tag className="w-3.5 h-3.5" aria-hidden />
              <span>{t("contacts.bulkTag")}</span>
            </Button>
          ) : undefined
        }
        deleteAction={
          bulkActions.includes("delete") && canDelete
            ? { label: t("contacts.bulkDelete"), onClick: onRequestBulkDelete }
            : undefined
        }
      />
      {tagModalOpen && onBulkTag && (
        <ContactsBulkTagModal
          open={tagModalOpen}
          onClose={() => setTagModalOpen(false)}
          selectedCount={selectedCount}
          onConfirm={onBulkTag}
          isPending={isTagPending}
        />
      )}
    </>
  );
}
