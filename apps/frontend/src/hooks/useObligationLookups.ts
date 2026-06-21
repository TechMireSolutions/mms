import { useMemo } from "react";
import { useContactsByIds } from "@/hooks/useContacts";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { SAMPLE_USERS } from "@/lib/data/usersData";
import { MOCK_CONTACTS, MOCK_USERS } from "@/lib/data/obligationsData";
import type { Contact } from "@mms/shared";

/** Resolve obligation-linked contacts by id (globle2 §10 — no full list fetch). */
export function useMergedObligationContacts(
  ids: (string | number | null | undefined)[],
): Contact[] {
  const { data: live = [] } = useContactsByIds(ids);
  const idSignature = useMemo(
    () =>
      [...new Set(ids.filter((id) => id != null && String(id).length > 0).map(String))].sort().join(","),
    [ids],
  );

  return useMemo(() => {
    const idSet = new Set(idSignature ? idSignature.split(",") : []);
    const merged = [...live];
    MOCK_CONTACTS.forEach((mc) => {
      if (idSet.has(String(mc.id)) && !merged.some((c) => String(c.id) === String(mc.id))) {
        merged.push(mc as unknown as Contact);
      }
    });
    return merged;
  }, [live, idSignature]);
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
