import { useMemo } from "react";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { CONTACTS } from "@/lib/data/contactsData";
import { SAMPLE_USERS } from "@/lib/data/usersData";
import { MOCK_CONTACTS, MOCK_USERS } from "@/lib/data/obligationsData";
import type { Contact } from "@/lib/contactFields";

/** Live contacts merged with obligation demo fixtures (deduped by id). */
export function useMergedObligationContacts(): Contact[] {
  const live = useLiveCollection<Contact>("contacts", CONTACTS);
  return useMemo(() => {
    const merged = [...live];
    MOCK_CONTACTS.forEach((mc) => {
      if (!merged.some((c) => String(c.id) === String(mc.id))) {
        merged.push(mc as unknown as Contact);
      }
    });
    return merged;
  }, [live]);
}

/** Live users merged with obligation demo fixtures (deduped by id). */
export function useMergedObligationUsers(): typeof SAMPLE_USERS {
  const live = useLiveCollection("users", SAMPLE_USERS);
  return useMemo(() => {
    const merged = [...live];
    MOCK_USERS.forEach((mu) => {
      if (!merged.some((u) => String(u.id) === String(mu.id))) {
        merged.push(mu as unknown as (typeof live)[number]);
      }
    });
    return merged;
  }, [live]);
}
