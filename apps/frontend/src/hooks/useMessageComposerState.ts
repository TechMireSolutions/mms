import { useState, useCallback } from "react";
import type { StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";
import { validateRecipientAddress } from "@mms/shared";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";

export interface MessagingTarget {
  channel: "sms" | "whatsapp" | "email";
  recipients: MessagingRecipient[];
  initialMessage?: string;
  initialSubject?: string;
  templateId?: string;
}

/**
 * Custom hook to manage the state of the MessageComposer dialog.
 * Gates on messaging.write and drops recipients without a valid channel address.
 */
export function useMessageComposerState() {
  const [messagingTarget, setMessagingTarget] = useState<MessagingTarget | null>(null);
  const { can } = usePermissions();
  const { t } = useTranslation();
  const canWriteMessaging = can("messaging.write");

  const openComposer = useCallback(
    (
      channel: "sms" | "whatsapp" | "email",
      recipients: MessagingRecipient[],
      options?: { initialMessage?: string; initialSubject?: string; templateId?: string }
    ) => {
      if (!canWriteMessaging) {
        notify.error(t("messaging.writeDenied"));
        return;
      }

      const eligible = recipients.filter((recipient) => validateRecipientAddress(recipient, channel).isValid);
      if (eligible.length === 0) {
        notify.error(t("messaging.noEligibleRecipients"));
        return;
      }

      setMessagingTarget({
        channel,
        recipients: eligible,
        initialMessage: options?.initialMessage,
        initialSubject: options?.initialSubject,
        templateId: options?.templateId,
      });
    },
    [canWriteMessaging, t]
  );

  const closeComposer = useCallback(() => {
    setMessagingTarget(null);
  }, []);

  return {
    messagingTarget,
    setMessagingTarget,
    openComposer,
    closeComposer,
    canWriteMessaging,
  };
}
