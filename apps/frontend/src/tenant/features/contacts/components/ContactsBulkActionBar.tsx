import {
  Download,
  Users,
  Trash2,
  MessageCircle,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import type { Contact } from "@mms/shared";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
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
      {bulkActions.includes("whatsapp") && !viewingDeleted && canWriteMessaging && (
        <Button
          type="button"
          size="sm"
          disabled={selectedTargets.waTargets.length === 0}
          onClick={() => onWhatsApp(selectedTargets.waTargets)}
          aria-label={t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
          className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-sm"
        >
          <MessageCircle className="w-3.5 h-3.5" />{" "}
          {t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
        </Button>
      )}
      {bulkActions.includes("sms") && !viewingDeleted && canWriteMessaging && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={selectedTargets.smsReady.length === 0}
          onClick={() => onSms(selectedTargets.smsReady)}
          aria-label={t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
          className="gap-1.5 border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
        >
          <MessageSquare className="w-3.5 h-3.5" />{" "}
          {t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
        </Button>
      )}
      {bulkActions.includes("export") && canExport && !viewingDeleted && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBulkExport}
          className="gap-1.5 font-semibold"
        >
          <Download className="w-3.5 h-3.5" /> {t("contacts.bulkExport")}
        </Button>
      )}
      {bulkActions.includes("delete") && canDelete && !viewingDeleted && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onRequestBulkDelete}
          className="gap-1.5 font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t("contacts.bulkDelete")}
        </Button>
      )}
      {viewingDeleted && canDelete && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRequestBulkRestore}
          className="gap-1.5 border-primary/40 text-primary font-semibold hover:bg-primary/10"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {t("contacts.bulkRestore")}
        </Button>
      )}
    </BulkSelectionBar>
  );
}
