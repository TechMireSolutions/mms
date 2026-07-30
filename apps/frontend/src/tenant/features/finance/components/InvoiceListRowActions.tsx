import type React from "react";
import { Eye, MessageCircle, MessageSquare, ReceiptText, RotateCcw, Trash2 } from "lucide-react";
import type { StandardMessagingRecipient } from "@mms/shared";
import { getOutstandingAmountForInvoice } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { Invoice } from "@/lib/data/financeData";

export type InvoiceMessageChannel = "sms" | "whatsapp" | "email";

interface InvoiceListRowActionsProps {
  invoice: Invoice;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging: boolean;
  showDeleted: boolean;
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  onRequestDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: InvoiceMessageChannel, recipients: StandardMessagingRecipient[]) => void;
  className?: string;
}

export function InvoiceListRowActions({
  invoice,
  canWrite,
  canDelete,
  canWriteMessaging,
  showDeleted,
  onView,
  onRecord,
  onRequestDelete,
  onRestore,
  openComposer,
  className = "flex items-center gap-1",
}: InvoiceListRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const invoiceRecord = invoice as unknown as Record<string, unknown>;
  const phone = typeof invoiceRecord.phone === "string" ? invoiceRecord.phone.trim() : "";
  const email = typeof invoiceRecord.email === "string" ? invoiceRecord.email : undefined;
  const recipient: StandardMessagingRecipient = {
    id: invoice.id,
    name: invoice.studentName,
    phone,
    email,
    amount: getOutstandingAmountForInvoice(invoice),
    dueDate: invoice.dueDate,
  };
  const showDeleteRestoreAction = canDelete && (showDeleted ? Boolean(onRestore) : Boolean(onRequestDelete));

  return (
    <div className={className}>
      {canWriteMessaging && !showDeleted && phone ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openComposer("whatsapp", [recipient])}
            title={t("messaging.sendWhatsapp")}
            aria-label={t("messaging.sendWhatsapp")}
            className="rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openComposer("sms", [recipient])}
            title={t("messaging.sendSms")}
            aria-label={t("messaging.sendSms")}
            className="rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(invoice)}
        aria-label={t("finance.viewInvoice", { id: invoice.id })}
        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      {canWrite && !showDeleted && invoice.status !== "paid" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRecord(invoice)}
          aria-label={t("finance.recordPaymentFor", { id: invoice.id })}
          className="rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
        >
          <ReceiptText className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
      {showDeleteRestoreAction && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (showDeleted ? onRestore?.(invoice.id) : onRequestDelete?.(invoice.id))}
          aria-label={showDeleted ? t("finance.trash.restore") : t("common.delete")}
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      )}
    </div>
  );
}
