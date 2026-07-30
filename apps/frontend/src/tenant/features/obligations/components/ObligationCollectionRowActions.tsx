import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { ObligationCollection } from "@/lib/data/obligationsData";
import { Eye, MessageCircle, MessageSquare, Printer, RotateCcw, Trash2 } from "lucide-react";

interface ObligationCollectionRowActionsProps {
  collection: ObligationCollection;
  canDelete: boolean;
  showDeleted: boolean;
  onView: (collection: ObligationCollection) => void;
  onPrint: (collection: ObligationCollection) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onMessage?: (channel: "sms" | "whatsapp" | "email", collections: ObligationCollection[]) => void;
}

export function ObligationCollectionRowActions({
  collection,
  canDelete,
  showDeleted,
  onView,
  onPrint,
  onDelete,
  onRestore,
  onMessage,
}: ObligationCollectionRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {onMessage && !showDeleted && (
        <>
          <Button
            type="button"
            onClick={() => onMessage("whatsapp", [collection])}
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-success shadow-none transition-colors"
            title={t("obligations.list.actionWhatsApp")}
            aria-label={t("obligations.list.actionWhatsApp")}
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            onClick={() => onMessage("sms", [collection])}
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-info shadow-none transition-colors"
            title={t("obligations.list.actionSms")}
            aria-label={t("obligations.list.actionSms")}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </>
      )}
      <Button
        type="button"
        onClick={() => onView(collection)}
        variant="ghost"
        size="icon"
        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
        aria-label={t("obligations.actions.view", { receipt: collection.receipt_no })}
        title={t("obligations.actions.viewShort")}
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      {!showDeleted && (
        <Button
          type="button"
          onClick={() => onPrint(collection)}
          variant="ghost"
          size="icon"
          className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
          aria-label={t("obligations.actions.print", { receipt: collection.receipt_no })}
          title={t("obligations.actions.printShort")}
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`rounded-lg hover:bg-muted shadow-none transition-colors ${showDeleted ? "text-muted-foreground hover:text-primary" : "text-muted-foreground hover:text-destructive"}`}
          aria-label={showDeleted ? t("obligations.trash.restore") : t("common.delete")}
          onClick={() => {
            if (showDeleted) {
              if (!confirm(t("obligations.trash.bulkRestoreConfirm", { count: 1 }))) return;
              void onRestore?.(collection.id);
            } else {
              if (!confirm(t("obligations.trash.deleteConfirm"))) return;
              void onDelete?.(collection.id);
            }
          }}
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </Button>
      )}
    </div>
  );
}
