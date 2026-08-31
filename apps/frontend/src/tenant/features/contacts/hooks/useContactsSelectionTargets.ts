import type { Contact } from "@mms/shared";
import { computeContactsSelectionTargets } from "@/tenant/features/contacts/hooks/contactsSelectionTargets";

export function useContactsSelectionTargets({
  selected,
  workContacts,
}: {
  selected: Array<string | number>;
  workContacts: Contact[];
}): { waTargets: Contact[]; smsReady: Contact[]; emailReady: Contact[] } {
  return (() =>
      computeContactsSelectionTargets({
        selectedIds: selected,
        workContacts,
      }))();
}
