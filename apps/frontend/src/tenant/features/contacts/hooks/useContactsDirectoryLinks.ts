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
  const linkSourceContacts = (() => {
    const rows = [...workContacts];
    if (editContact) rows.push(editContact);
    if (viewContact) rows.push(viewContact);
    return rows;
  })();

  const siblingSubjects = (() => {
    const subjects: Contact[] = [];
    if (viewContact) subjects.push(viewContact);
    if (editContact) subjects.push(editContact);
    return subjects;
  })();

  const linkedContactIds = (() => collectLinkedContactIds(linkSourceContacts))();

  const { data: resolvedLinkContacts = [] } = useContactsByIds(linkedContactIds);

  const partialDirectory = (() => mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts))();

  const siblingContactIds = (() => {
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
  })();

  const { data: resolvedSiblingContacts = [] } = useContactsByIds(siblingContactIds);

  return (() => mergeContactLinkDirectory(partialDirectory, resolvedSiblingContacts))();
}
