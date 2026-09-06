import React, { type JSX } from "react";
import {
  BulkActionDock,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
  BulkSelectionExportAction,
  BulkSelectionMessagingActions,
  BulkSelectionStatusAction,
  type BulkSelectionMessageChannel,
} from "@/components/common/BulkActionDock";
import type {
  BulkSelectionPlacement,
  BulkSelectionTone,
} from "@/components/ui/BulkSelectionBar";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type { BulkSelectionPlacement, BulkSelectionTone, BulkSelectionMessageChannel };

export interface WorkActionTransition {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "destructive" | "outline" | "ghost" | "secondary";
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export interface WorkActionDockProps {
  selectedCount: number;
  countLabel: React.ReactNode;
  onClearSelection: () => void;
  clearLabel?: string;

  /** Configurable lifecycle transitions (e.g. Approve, Reject, Mark Attended, Post). */
  transitions?: WorkActionTransition[];

  /** Optional status dropdown selector for batch updates. */
  statusAction?: {
    label: string;
    statuses: readonly string[];
    statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
    onSelectStatus: (status: string) => void;
    disabled?: boolean;
  };

  /** Multi-channel messaging integration. */
  messaging?: {
    onChannel: (channel: BulkSelectionMessageChannel) => void;
    labels: {
      whatsapp: string;
      sms: string;
      email?: string;
    };
    channels?: Partial<Record<BulkSelectionMessageChannel, boolean>>;
  };

  /** Export action. */
  exportAction?: {
    onExport: () => void | Promise<void>;
    label: string;
  };

  /** Delete action. */
  deleteAction?: {
    onDelete: () => void;
    label: string;
  };

  /** Restore action (when viewing trash). */
  restoreAction?: {
    onRestore: () => void;
    label: string;
  };

  placement?: BulkSelectionPlacement;
  tone?: BulkSelectionTone;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  enableEscapeKey?: boolean;
}

/**
 * Universal WorkActionDock primitive.
 * Extensible wrapper around BulkActionDock handling multi-item lifecycle transitions,
 * status changes, messaging, export, and soft-delete/restore operations.
 */
export function WorkActionDock({
  selectedCount,
  countLabel,
  onClearSelection,
  clearLabel,
  transitions,
  statusAction,
  messaging,
  exportAction,
  deleteAction,
  restoreAction,
  placement = "floating",
  tone = "glass",
  leading,
  trailing,
  children,
  className,
  "aria-label": ariaLabel = "Work actions dock",
  enableEscapeKey = true,
}: WorkActionDockProps): JSX.Element | null {
  if (selectedCount <= 0) return null;

  return (
    <BulkActionDock
      selectedCount={selectedCount}
      countLabel={countLabel}
      onClearSelection={onClearSelection}
      clearLabel={clearLabel}
      placement={placement}
      tone={tone}
      leading={leading}
      trailing={trailing}
      className={className}
      aria-label={ariaLabel}
      enableEscapeKey={enableEscapeKey}
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Custom Lifecycle Transition Buttons */}
        {transitions?.map((transition) => {
          const Icon = transition.icon;
          const variant =
            transition.tone === "primary"
              ? "default"
              : transition.tone === "destructive"
              ? "destructive"
              : transition.tone === "secondary"
              ? "secondary"
              : transition.tone === "outline"
              ? "outline"
              : "outline";

          return (
            <Button
              key={transition.id}
              type="button"
              variant={variant}
              size="sm"
              disabled={transition.disabled || transition.loading}
              onClick={() => void transition.onClick()}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
            >
              {transition.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : Icon ? (
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              ) : null}
              <span>{transition.label}</span>
            </Button>
          );
        })}

        {/* Status Dropdown Transition */}
        {statusAction && (
          <BulkSelectionStatusAction
            label={statusAction.label}
            statuses={statusAction.statuses}
            statusBadgeConfig={statusAction.statusBadgeConfig}
            onSelectStatus={statusAction.onSelectStatus}
            disabled={statusAction.disabled}
          />
        )}

        {/* Messaging Channels */}
        {messaging && (
          <BulkSelectionMessagingActions
            onChannel={messaging.onChannel}
            labels={messaging.labels}
            channels={messaging.channels}
          />
        )}

        {/* Export */}
        {exportAction && (
          <BulkSelectionExportAction
            onClick={exportAction.onExport}
            label={exportAction.label}
          />
        )}

        {/* Restore (Trash view) */}
        {restoreAction && (
          <BulkSelectionRestoreAction
            onClick={restoreAction.onRestore}
            label={restoreAction.label}
          />
        )}

        {/* Delete */}
        {deleteAction && (
          <BulkSelectionDeleteAction
            onClick={deleteAction.onDelete}
            label={deleteAction.label}
          />
        )}

        {/* Additional custom action slots */}
        {children}
      </div>
    </BulkActionDock>
  );
}
