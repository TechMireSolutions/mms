import React from "react";
import {
  EntityMessagingActions,
  type EntityMessagingLabels,
} from "@/components/ui/EntityMessagingActions";

export type EntityMessagingQuickActionLabels = EntityMessagingLabels & {
  call: string;
  whatsapp: string;
  sms: string;
  email: string;
};

export interface EntityMessagingQuickActionsProps {
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  labels: EntityMessagingQuickActionLabels;
  callAriaLabel?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  messagingEnabled?: boolean;
  className?: string;
}

/**
 * Backward-compatible wrapper delegating to EntityMessagingActions with variant="button-group".
 */
export const EntityMessagingQuickActions = (function EntityMessagingQuickActions(
  props: EntityMessagingQuickActionsProps,
): React.JSX.Element | null {
  return <EntityMessagingActions variant="button-group" {...props} />;
});
