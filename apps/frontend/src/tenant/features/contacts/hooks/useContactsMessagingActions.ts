import { useCallback } from "react";
import {
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  toMessagingRecipient,
  type Contact,
} from "@mms/shared";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

/** Contacts messaging openers backed by the shared MessageComposer state. */
export function useContactsMessagingActions() {
  const {
    messagingTarget,
    openComposer,
    closeComposer,
    canWriteMessaging,
  } = useMessageComposerState();

  const toComposerRecipients = useCallback(
    (contacts: Contact[]) =>
      contacts.map((c) =>
        toMessagingRecipient(c, { getDisplayName, getPrimaryPhone, getPrimaryEmail }),
      ),
    [],
  );

  const handleWhatsApp = ((contacts: Contact[]) => {
      openComposer("whatsapp", toComposerRecipients(contacts));
    });
  const handleSms = ((contacts: Contact[]) => {
      openComposer("sms", toComposerRecipients(contacts));
    });
  const handleEmail = ((contacts: Contact[]) => {
      openComposer("email", toComposerRecipients(contacts));
    });

  return {
    messagingTarget,
    closeComposer,
    canWriteMessaging,
    handleWhatsApp,
    handleSms,
    handleEmail,
  };
}
