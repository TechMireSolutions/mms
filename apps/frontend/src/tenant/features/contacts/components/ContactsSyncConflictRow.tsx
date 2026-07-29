import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { formatDateTime } from "@mms/shared";
import type { ContactsSyncConflict } from "@/lib/contacts/contactsSyncOutbox";
import { getSyncConflictKindLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ContactsSyncConflictDiffBody } from "@/tenant/features/contacts/components/ContactsSyncConflictDiffBody";
import { useContactsSyncConflictRow } from "@/tenant/features/contacts/hooks/useContactsSyncConflictRow";

export interface ContactsSyncConflictRowProps {
  entry: ContactsSyncConflict;
  title: string;
  onRequestDismiss: (id: string) => void;
  onResolved: () => void;
}

export function ContactsSyncConflictRow({
  entry,
  title,
  onRequestDismiss,
  onResolved,
}: ContactsSyncConflictRowProps): JSX.Element {
  const { t } = useTranslation();
  const {
    expanded,
    setExpanded,
    applying,
    fieldPicks,
    local,
    serverContact,
    serverLoading,
    diffs,
    togglePick,
    handleKeepMine,
    handleUseServer,
    handleApplyMerge,
  } = useContactsSyncConflictRow({ entry, onResolved });

  return (
    <li className="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSyncConflictKindLabel(entry.kind, t)} · {formatDateTime(entry.failedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((value) => !value)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-expanded={expanded}
            aria-label={expanded ? t("contacts.sync.conflictCollapse") : t("contacts.sync.conflictExpand")}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRequestDismiss(entry.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={t("contacts.sync.conflictDismissOne")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <ContactsSyncConflictDiffBody
          local={local}
          serverContact={serverContact}
          serverLoading={serverLoading}
          diffs={diffs}
          fieldPicks={fieldPicks}
          applying={applying}
          onTogglePick={togglePick}
          onApplyMerge={() => void handleApplyMerge()}
          onKeepMine={() => void handleKeepMine()}
          onUseServer={handleUseServer}
          t={t}
        />
      )}
    </li>
  );
}
