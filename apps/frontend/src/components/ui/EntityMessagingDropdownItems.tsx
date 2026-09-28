import React from "react";
import { EntityMessagingActions } from "@/components/ui/EntityMessagingActions";

export interface EntityMessagingDropdownItemsProps {
  showWhatsApp: boolean;
  showSms: boolean;
  showEmail: boolean;
  onWhatsAppClick: () => void;
  onSmsClick: () => void;
  onEmailClick: () => void;
  labels: {
    whatsapp: string;
    sms: string;
    email: string;
  };
}

/**
 * Backward-compatible wrapper delegating to EntityMessagingActions with variant="dropdown".
 */
export const EntityMessagingDropdownItems = (function EntityMessagingDropdownItems({
  showWhatsApp,
  showSms,
  showEmail,
  onWhatsAppClick,
  onSmsClick,
  onEmailClick,
  labels,
}: EntityMessagingDropdownItemsProps): React.JSX.Element {
  return (
    <EntityMessagingActions
      variant="dropdown"
      showWhatsApp={showWhatsApp}
      showSms={showSms}
      showEmail={showEmail}
      onWhatsApp={onWhatsAppClick}
      onSms={onSmsClick}
      onEmail={onEmailClick}
      labels={labels}
    />
  );
});
