import { useMemo } from "react";
import { deriveSiblingLinks, type Contact } from "@mms/shared";
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

  const partialDirectory = useMemo(
    () => mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts),
    [linkSourceContacts, resolvedLinkContacts],
  );

  const siblingContactIds = useMemo(() => {
    const subjects = [viewContact, editContact].filter(Boolean) as Contact[];
    if (subjects.length === 0) return [] as string[];
    const ids = new Set<string>();
    for (const subject of subjects) {
      for (const link of deriveSiblingLinks(subject, partialDirectory)) {
        ids.add(link.contactId);
      }
    }
    return [...ids];
  }, [viewContact, editContact, partialDirectory]);

  const { data: resolvedSiblingContacts = [] } = useContactsByIds(siblingContactIds);

  return useMemo(
    () => mergeContactLinkDirectory(partialDirectory, resolvedSiblingContacts),
    [partialDirectory, resolvedSiblingContacts],
  );
}
