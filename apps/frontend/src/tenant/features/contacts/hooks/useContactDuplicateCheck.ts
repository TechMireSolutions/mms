import { useEffect, useState } from "react";
import type { Contact } from "@mms/shared";
import { apiContract } from "@/lib/api";

export interface UseContactDuplicateCheckOptions {
  open: boolean;
  contactId?: string | number;
  contactDraft: Partial<Contact>;
}

export function useContactDuplicateCheck({
  open,
  contactId,
  contactDraft,
}: UseContactDuplicateCheckOptions): number {
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    if (!open || contactId) {
      setDuplicateCount(0);
      return;
    }
    const hasCandidateKey = Boolean(
      contactDraft.name?.trim() ||
      contactDraft.firstName?.trim() ||
      (contactDraft.phones && contactDraft.phones.some((p) => p.number?.trim())) ||
      (contactDraft.emails && contactDraft.emails.some((e) => e.address?.trim())) ||
      contactDraft.cnic?.trim()
    );
    if (!hasCandidateKey) {
      setDuplicateCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // The tag property is a computed frontend-only UI state added by normalization
        const { tag: _tag, ...cleanDraft } = contactDraft as Record<string, unknown>;
        const res = await apiContract.contacts.duplicateCheck({
          body: { contact: cleanDraft },
        });
        if (res.status === 200) {
          const body = res.body as { matchCount?: number } | undefined;
          setDuplicateCount(body?.matchCount ?? 0);
        }
      } catch {
        // Non-blocking duplicate check: ignore gracefully
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [open, contactId, contactDraft]);

  return duplicateCount;
}
