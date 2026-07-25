import { useState, useCallback } from "react";
import type { StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";

export interface MessagingTarget {
  channel: "sms" | "whatsapp" | "email";
  recipients: MessagingRecipient[];
  initialMessage?: string;
  initialSubject?: string;
  templateId?: string;
}

/**
 * Custom hook to manage the state of the MessageComposer dialog.
 * Unifies state management and types for sending message campaigns or quick reminders.
 */
export function useMessageComposerState() {
  const [messagingTarget, setMessagingTarget] = useState<MessagingTarget | null>(null);

  const openComposer = useCallback(
    (
      channel: "sms" | "whatsapp" | "email",
      recipients: MessagingRecipient[],
      options?: { initialMessage?: string; initialSubject?: string; templateId?: string }
    ) => {
      setMessagingTarget({
        channel,
        recipients,
        initialMessage: options?.initialMessage,
        initialSubject: options?.initialSubject,
        templateId: options?.templateId,
      });
    },
    []
  );

  const closeComposer = useCallback(() => {
    setMessagingTarget(null);
  }, []);

  return {
    messagingTarget,
    setMessagingTarget,
    openComposer,
    closeComposer,
  };
}
