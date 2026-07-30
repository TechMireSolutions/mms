import { CheckCircle2, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { JournalEntry } from "@/lib/data/accountingData";

interface JournalEntryActionsProps {
  entry: JournalEntry;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onPost: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onReverse: (entry: JournalEntry) => void;
}

export function JournalEntryActions({
  entry,
  canWrite,
  canDelete,
  showDeleted,
  onView,
  onEdit,
  onPost,
  onDelete,
  onReverse,
}: JournalEntryActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("accounting.journal.actions.viewEntry", { ref: entry.ref })}
        onClick={() => onView(entry)}
        className="text-muted-foreground hover:text-primary"
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      {entry.status === "draft" && !showDeleted && (
        <>
          {canWrite && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("accounting.journal.actions.editEntry", { ref: entry.ref })}
              onClick={() => onEdit(entry)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )}
          {canWrite && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("accounting.journal.actions.postEntry", { ref: entry.ref })}
              onClick={() => onPost(entry)}
              className="text-muted-foreground hover:text-success"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )}
        </>
      )}
      {canDelete && (entry.status === "draft" || showDeleted) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={showDeleted ? t("accounting.trash.restore") : t("common.delete")}
          onClick={() => onDelete(entry.id)}
          className={`text-muted-foreground ${showDeleted ? "hover:text-primary" : "hover:text-destructive"}`}
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </Button>
      )}
      {canWrite && entry.status === "posted" && !showDeleted && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("accounting.journal.actions.reverseEntry", { ref: entry.ref })}
          onClick={() => onReverse(entry)}
          className="text-muted-foreground hover:text-warning"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
