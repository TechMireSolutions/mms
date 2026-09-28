import React from "react";
import {
  EntityMessagingActions,
  type EntityMessagingLabels,
} from "@/components/ui/EntityMessagingActions";

export type EntityMessagingIconActionLabels = EntityMessagingLabels;

export interface EntityMessagingIconActionsProps {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  labels: EntityMessagingIconActionLabels;
  callAriaLabel?: string;
  whatsappAriaLabel?: string;
  smsAriaLabel?: string;
  emailAriaLabel?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  messagingEnabled?: boolean;
  showCall?: boolean;
  showArchived?: boolean;
  className?: string;
}

/**
 * Backward-compatible wrapper delegating to EntityMessagingActions with variant="icon-row".
 */
export const EntityMessagingIconActions = (function EntityMessagingIconActions(
  props: EntityMessagingIconActionsProps,
): React.JSX.Element | null {
  return <EntityMessagingActions variant="icon-row" {...props} />;
});
