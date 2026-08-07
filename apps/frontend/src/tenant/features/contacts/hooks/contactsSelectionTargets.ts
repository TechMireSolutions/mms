import { getPrimaryPhone, hasWhatsApp, type Contact } from "@mms/shared";
import { computeModuleMessagingSelectionTargets } from "@/lib/messaging/computeModuleMessagingSelectionTargets";

export interface ContactsSelectionTargets {
  waTargets: Contact[];
  smsReady: Contact[];
}

/** Pure eligibility for bulk messaging from current-page rows ∩ selected ids. */
export function computeContactsSelectionTargets({
  selectedIds,
  workContacts,
}: {
  selectedIds: ReadonlyArray<string | number>;
  workContacts: Contact[];
}): ContactsSelectionTargets {
  const { waTargets, smsReady } = computeModuleMessagingSelectionTargets({
    selectedIds,
    rows: workContacts,
    hasWhatsApp: (contact) => hasWhatsApp(contact),
    hasSms: (contact) => Boolean(getPrimaryPhone(contact)),
  });
  return { waTargets, smsReady };
}
