import { useMemo } from "react";
import type { Contact } from "@mms/shared";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import { useContactsByIds } from "@/tenant/features/contacts/hooks/useContacts";

export function useContactsDirectoryLinks({
  needsFullContactsList,
  contacts,
  workContacts,
  editContact,
  viewContact,
}: {
  needsFullContactsList: boolean;
  contacts: Contact[];
  workContacts: Contact[];
  editContact: Contact | null;
  viewContact: Contact | null;
}) {
  const linkSourceContacts = useMemo(() => {
    const rows = [...workContacts];
    if (editContact) rows.push(editContact);
    if (viewContact) rows.push(viewContact);
    return rows;
  }, [workContacts, editContact, viewContact]);

  const linkedContactIds = useMemo(
    () => collectLinkedContactIds(linkSourceContacts),
    [linkSourceContacts],
  );

  const { data: resolvedLinkContacts = [] } = useContactsByIds(
    needsFullContactsList ? [] : linkedContactIds,
  );

  return useMemo(() => {
    if (needsFullContactsList) return contacts;
    return mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts);
  }, [needsFullContactsList, contacts, linkSourceContacts, resolvedLinkContacts]);
}
