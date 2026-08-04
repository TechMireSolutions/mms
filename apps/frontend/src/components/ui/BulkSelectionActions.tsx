import { Mail, MessageCircle, MessageSquare, RotateCcw, ChevronDown, Tag } from "lucide-react";
import type React from "react";
import type { ReactElement } from "react";
import {
  bulkSelectionActionClassName,
  bulkSelectionDeleteClassName,
  bulkSelectionRestoreClassName,
} from "@/components/ui/BulkSelectionBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

export type BulkSelectionMessageChannel = "whatsapp" | "sms" | "email";

export interface BulkSelectionMessagingActionsProps {
  onChannel: (channel: BulkSelectionMessageChannel) => void;
  labels: {
    whatsapp: string;
    sms: string;
    email: string;
  };
  /** Channels to render. Omit a channel to hide it. Default: all three. */
  channels?: Partial<Record<BulkSelectionMessageChannel, boolean>>;
}

/**
 * Floating outline WhatsApp / SMS / Email actions for Work bulk bars.
 */
export function BulkSelectionMessagingActions({
  onChannel,
  labels,
  channels = { whatsapp: true, sms: true, email: true },
}: BulkSelectionMessagingActionsProps): ReactElement {
  return (
    <>
      {channels.whatsapp !== false && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onChannel("whatsapp")}
          className={bulkSelectionActionClassName}
        >
          <MessageCircle className="w-3.5 h-3.5 text-success" /> {labels.whatsapp}
        </Button>
      )}
      {channels.sms !== false && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onChannel("sms")}
          className={bulkSelectionActionClassName}
        >
          <MessageSquare className="w-3.5 h-3.5 text-info" /> {labels.sms}
        </Button>
      )}
      {channels.email !== false && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onChannel("email")}
          className={bulkSelectionActionClassName}
        >
          <Mail className="w-3.5 h-3.5 text-primary" /> {labels.email}
        </Button>
      )}
    </>
  );
}

export interface BulkSelectionRestoreActionProps {
  label: string;
  onClick: () => void;
}

/** Floating outline restore action for soft-delete trash bulk bars. */
export function BulkSelectionRestoreAction({
  label,
  onClick,
}: BulkSelectionRestoreActionProps): ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={bulkSelectionRestoreClassName}
    >
      <RotateCcw className="w-3.5 h-3.5" /> {label}
    </Button>
  );
}

export interface BulkSelectionDeleteActionProps {
  label: string;
  onClick: () => void;
  /** Optional leading icon (defaults to none). Pass Trash2/Archive as needed. */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

/** Destructive delete/trash action for Work bulk bars. */
export function BulkSelectionDeleteAction({
  label,
  onClick,
  icon: Icon,
}: BulkSelectionDeleteActionProps): ReactElement {
  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onClick}
      className={bulkSelectionDeleteClassName}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden /> : null}
      {label}
    </Button>
  );
}

export interface BulkSelectionStatusActionProps {
  label: string;
  statuses: readonly string[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  onSelectStatus: (status: string) => void;
}

/** Status dropdown action for Work bulk bars (Students / Teachers). */
export function BulkSelectionStatusAction({
  label,
  statuses,
  statusBadgeConfig,
  onSelectStatus,
}: BulkSelectionStatusActionProps): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className={bulkSelectionActionClassName}>
          <Tag className="w-3.5 h-3.5 text-primary" /> {label}{" "}
          <ChevronDown className="w-3 h-3 ms-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {statuses.map((statusVal) => (
          <DropdownMenuItem key={statusVal} onClick={() => onSelectStatus(statusVal)}>
            <StatusBadge status={statusVal} size="sm" config={statusBadgeConfig} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
