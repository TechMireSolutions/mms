import type { JSX, ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionRestoreAction,
  type BulkSelectionMessageChannel,
} from "@/components/ui/BulkSelectionActions";

export interface ModuleWorkBulkActionBarProps {
  selectedCount: number;
  viewingDeleted: boolean;
  countLabel: string;
  leading: ReactNode;
  deselectLabel: string;
  canDelete: boolean;
  restoreLabel: string;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  /** Live messaging strip (omit when trash or messaging unavailable). */
  messaging?: {
    onChannel: (channel: BulkSelectionMessageChannel) => void;
    labels: {
      whatsapp: string;
      sms: string;
      email?: string;
    };
    channels: {
      whatsapp: boolean;
      sms: boolean;
      email: boolean;
    };
  };
  exportAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /** Module-specific middle actions (e.g. Students status). */
  extraActions?: ReactNode;
  deleteAction?: {
    label: string;
    onClick: () => void;
  };
}

/** Shared Work bulk selection chrome — Contacts/Students compose labels + slots. */
export function ModuleWorkBulkActionBar({
  selectedCount,
  viewingDeleted,
  countLabel,
  leading,
  deselectLabel,
  canDelete,
  restoreLabel,
  onRequestBulkRestore,
  onClearSelection,
  messaging,
  exportAction,
  extraActions,
  deleteAction,
}: ModuleWorkBulkActionBarProps): JSX.Element {
  return (
    <BulkSelectionBar
      placement="inline"
      tone="glass"
      selectedCount={selectedCount}
      countLabel={countLabel}
      leading={leading}
      trailing={
        <BulkSelectionClearAction label={deselectLabel} onClick={onClearSelection} />
      }
    >
      {viewingDeleted ? (
        canDelete && (
          <BulkSelectionRestoreAction label={restoreLabel} onClick={onRequestBulkRestore} />
        )
      ) : (
        <>
          {messaging && (
            <BulkSelectionMessagingActions
              onChannel={messaging.onChannel}
              labels={messaging.labels}
              channels={messaging.channels}
            />
          )}
          {exportAction && (
            <BulkSelectionExportAction label={exportAction.label} onClick={exportAction.onClick} />
          )}
          {extraActions}
          {deleteAction && (
            <>
              <div className="h-4 w-px bg-border" />
              <BulkSelectionDeleteAction
                label={deleteAction.label}
                onClick={deleteAction.onClick}
                icon={Trash2}
              />
            </>
          )}
        </>
      )}
    </BulkSelectionBar>
  );
}
