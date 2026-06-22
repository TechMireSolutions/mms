import { useContactsByIds } from "@/hooks/useContacts";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { SAMPLE_USERS } from "@/lib/data/usersData";
import type { Contact } from "@mms/shared";

/** Resolve obligation-linked contacts by id (globle2 §10 — no full list fetch). */
export function useMergedObligationContacts(
  ids: (string | number | null | undefined)[],
): Contact[] {
  const { data: live = [] } = useContactsByIds(ids);
  return live;
}

/** Live users merged with obligation demo fixtures (deduped by id). */
export function useMergedObligationUsers(): typeof SAMPLE_USERS {
  return useLiveCollection("users", SAMPLE_USERS);
}
