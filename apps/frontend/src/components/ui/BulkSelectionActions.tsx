import { Mail, MessageCircle, MessageSquare, RotateCcw } from "lucide-react";
import type { ReactElement } from "react";
import {
  bulkSelectionActionClassName,
  bulkSelectionRestoreClassName,
} from "@/components/ui/BulkSelectionBar";
import { Button } from "@/components/ui/button";

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
