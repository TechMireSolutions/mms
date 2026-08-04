import { Download, Trash2, Users } from "lucide-react";
import type { Contact } from "@mms/shared";
import {
  BulkSelectionBar,
  bulkSelectionActionClassName,
} from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionDeleteAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";
import { Button } from "@/components/ui/button";
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
    <BulkSelectionBar
      placement="inline"
      tone="glass"
      selectedCount={selectedCount}
      countLabel={t("contacts.selectedCount", { count: selectedCount })}
      leading={<Users className="w-4 h-4 text-primary" aria-hidden />}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground font-medium"
        >
          {t("contacts.deselect")}
        </Button>
      }
    >
      {viewingDeleted ? (
        canDelete && (
          <BulkSelectionRestoreAction
            label={t("contacts.bulkRestore")}
            onClick={onRequestBulkRestore}
          />
        )
      ) : (
        <>
          {showMessaging && (
            <BulkSelectionMessagingActions
              onChannel={handleChannel}
              labels={{
                whatsapp: t("contacts.whatsappBulk", {
                  count: selectedTargets.waTargets.length,
                }),
                sms: t("contacts.smsBulk", { count: selectedTargets.smsReady.length }),
                email: t("contacts.columns.email"),
              }}
              channels={{
                whatsapp: showWhatsApp,
                sms: showSms,
                email: false,
              }}
            />
          )}
          {bulkActions.includes("export") && canExport && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onBulkExport}
              className={bulkSelectionActionClassName}
            >
              <Download className="w-3.5 h-3.5" /> {t("contacts.bulkExport")}
            </Button>
          )}
          {bulkActions.includes("delete") && canDelete && (
            <>
              <div className="h-4 w-px bg-border" />
              <BulkSelectionDeleteAction
                label={t("contacts.bulkDelete")}
                onClick={onRequestBulkDelete}
                icon={Trash2}
              />
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
