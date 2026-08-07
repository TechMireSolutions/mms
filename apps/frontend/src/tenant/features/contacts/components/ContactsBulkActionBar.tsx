import type { JSX } from "react";
import { Users } from "lucide-react";
import type { Contact } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import type { BulkSelectionMessageChannel } from "@/components/ui/BulkSelectionActions";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactsBulkActionBarProps {
  selectedCount: number;
  viewingDeleted: boolean;
  bulkActions: readonly string[];
  canWriteMessaging: boolean;
  canExport: boolean;
  canDelete: boolean;
  selectedTargets: {
    waTargets: Contact[];
    smsReady: Contact[];
  };
  onWhatsApp: (targets: Contact[]) => void;
  onSms: (targets: Contact[]) => void;
  onBulkExport: () => void | Promise<void>;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

export function ContactsBulkActionBar({
  selectedCount,
  viewingDeleted,
  bulkActions,
  canWriteMessaging,
  canExport,
  canDelete,
  selectedTargets,
  onWhatsApp,
  onSms,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: ContactsBulkActionBarProps): JSX.Element {
  const { t } = useTranslation();

  const showWhatsApp = bulkActions.includes("whatsapp") && canWriteMessaging;
  const showSms = bulkActions.includes("sms") && canWriteMessaging;
  const showMessaging = !viewingDeleted && (showWhatsApp || showSms);

  const handleChannel = (channel: BulkSelectionMessageChannel): void => {
    if (channel === "whatsapp") onWhatsApp(selectedTargets.waTargets);
    else if (channel === "sms") onSms(selectedTargets.smsReady);
  };

  return (
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
              },
              channels: {
                whatsapp: showWhatsApp,
                sms: showSms,
                email: false,
              },
            }
          : undefined
      }
      exportAction={
        bulkActions.includes("export") && canExport
          ? { label: t("contacts.bulkExport"), onClick: onBulkExport }
          : undefined
      }
      deleteAction={
        bulkActions.includes("delete") && canDelete
          ? { label: t("contacts.bulkDelete"), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
