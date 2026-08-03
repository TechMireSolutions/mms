import { useMemo } from "react";
import type { Contact } from "@mms/shared";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import { useContactsByIds } from "@/tenant/features/contacts/hooks/useContacts";

export function useContactsDirectoryLinks({
  workContacts,
  editContact,
  viewContact,
}: {
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

  const { data: resolvedLinkContacts = [] } = useContactsByIds(linkedContactIds);

  return useMemo(
    () => mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts),
    [linkSourceContacts, resolvedLinkContacts],
  );
}
