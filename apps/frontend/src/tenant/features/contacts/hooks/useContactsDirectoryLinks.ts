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

  const siblingSubjects = useMemo(() => {
    const subjects: Contact[] = [];
    if (viewContact) subjects.push(viewContact);
    if (editContact) subjects.push(editContact);
    return subjects;
  }, [viewContact, editContact]);

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
    const knownIds = new Set(
      partialDirectory
        .map((contact) => (contact.id == null ? "" : String(contact.id).trim()))
        .filter(Boolean),
    );
    const ids = new Set<string>();
    for (const subject of siblingSubjects) {
      for (const link of deriveSiblingLinks(subject, partialDirectory)) {
        if (!knownIds.has(link.contactId)) ids.add(link.contactId);
      }
    }
    return [...ids];
  }, [siblingSubjects, partialDirectory]);

  const { data: resolvedSiblingContacts = [] } = useContactsByIds(siblingContactIds);

  return useMemo(
    () => mergeContactLinkDirectory(partialDirectory, resolvedSiblingContacts),
    [partialDirectory, resolvedSiblingContacts],
  );
}
