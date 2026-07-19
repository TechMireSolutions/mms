import { useState, useCallback } from "react";
import type { MessagingRecipient } from "@/components/ui/MessageComposer";

export interface MessagingTarget {
  channel: "sms" | "whatsapp" | "email";
  recipients: MessagingRecipient[];
}

/**
 * Custom hook to manage the state of the MessageComposer dialog.
 * Unifies state management and types for sending message campaigns or quick reminders.
 */
export function useMessageComposerState() {
  const [messagingTarget, setMessagingTarget] = useState<MessagingTarget | null>(null);

  const openComposer = useCallback((channel: "sms" | "whatsapp" | "email", recipients: MessagingRecipient[]) => {
    setMessagingTarget({ channel, recipients });
  }, []);

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
