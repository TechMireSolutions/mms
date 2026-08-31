import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Contact, type ContactActivity, todayISO } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import {
  contactDetailQueryKey,
  fetchContactById,
} from "@/tenant/features/contacts/hooks/useContacts";

export function useContactDetailActions({
  allContacts,
  contactState,
  setContactState,
  noteText,
  setNoteText,
  canPersistContact,
  onUpdateContact,
}: {
  allContacts: Contact[];
  contactState: Contact;
  setContactState: Dispatch<SetStateAction<Contact>>;
  noteText: string;
  setNoteText: Dispatch<SetStateAction<string>>;
  canPersistContact: boolean;
  onUpdateContact?: (contact: Contact) => Promise<void>;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleAddNote = (async (event: FormEvent): Promise<void> => {
      event.preventDefault();
      const trimmed = noteText.trim();
      if (!trimmed || !canPersistContact || !onUpdateContact) return;

      const newActivity: ContactActivity = {
        id: `act-${crypto.randomUUID()}`,
        type: "note",
        content: trimmed,
        date: todayISO(),
        by: user?.name || t("contacts.detail.systemUser"),
      };

      const previousContact = contactState;
      const updatedContact = {
        ...contactState,
        activities: [newActivity, ...(contactState.activities || [])],
      };

      setContactState(updatedContact);
      setNoteText("");

      try {
        await onUpdateContact(updatedContact);
      } catch {
        setContactState(previousContact);
        setNoteText(trimmed);
        notify.error(t("contacts.detail.noteSaveFailed"));
      }
    });

  const handleNavigateToContact = ((targetId: string | number): void => {
      const target = allContacts.find((contact) => String(contact.id) === String(targetId));
      if (target) {
        setContactState(target);
        return;
      }

      const contactId = String(targetId);
      void queryClient
        .fetchQuery({
          queryKey: contactDetailQueryKey(contactId),
          queryFn: ({ signal }) => fetchContactById(contactId, signal),
        })
        .then((contact) => {
          if (contact) {
            setContactState(contact);
          }
        })
        .catch(() => {
          notify.error(t("contacts.detail.loadFailed"));
        });
    });

  return {
    handleAddNote,
    handleNavigateToContact,
  };
}
