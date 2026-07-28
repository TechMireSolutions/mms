import { useMemo } from "react";
import { getPrimaryPhone, hasWhatsApp, type Contact } from "@mms/shared";

export function useContactsSelectionTargets({
  selected,
  workContacts,
}: {
  selected: Array<string | number>;
  workContacts: Contact[];
}): { waTargets: Contact[]; smsReady: Contact[] } {
  return useMemo(() => {
    if (selected.length === 0) return { waTargets: [], smsReady: [] };

    const selectedSet = new Set(selected);
    const waTargets: Contact[] = [];
    const smsReady: Contact[] = [];

    for (const contact of workContacts) {
      if (!selectedSet.has(contact.id)) continue;
      if (hasWhatsApp(contact)) waTargets.push(contact);
      if (getPrimaryPhone(contact)) smsReady.push(contact);
    }

    return { waTargets, smsReady };
  }, [selected, workContacts]);
}
