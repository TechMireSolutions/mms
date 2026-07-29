import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Contact } from "@mms/shared";
import type {
  AddSubListItem,
  ContactSubListKey,
  EnsureSubListItem,
  RemoveSubListItem,
  UpdateSubListItem,
} from "@/tenant/features/contacts/components/formTabs/types";

export function useContactFormSubLists(
  setContactDraft: Dispatch<SetStateAction<Partial<Contact>>>,
) {
  const addSubListItem = useCallback<AddSubListItem>(
    (fieldKey, newItem) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        return {
          ...prev,
          [fieldKey]: [...currentList, newItem],
        };
      });
    },
    [setContactDraft],
  );

  /** Seed one row when the list is empty (idempotent under Strict Mode). */
  const ensureSubListItem = useCallback<EnsureSubListItem>(
    (fieldKey, newItem) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        if (currentList.length > 0) return prev;
        return { ...prev, [fieldKey]: [newItem] };
      });
    },
    [setContactDraft],
  );

  const updateSubListItem = useCallback<UpdateSubListItem>(
    (fieldKey, idx, patch) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        const nextList = currentList.map((item, i) =>
          i === idx ? { ...item, ...patch } : item,
        );
        return { ...prev, [fieldKey]: nextList };
      });
    },
    [setContactDraft],
  );

  const removeSubListItem = useCallback<RemoveSubListItem>(
    (fieldKey: ContactSubListKey, idx: number) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as unknown[]) || [];
        return {
          ...prev,
          [fieldKey]: currentList.filter((_, i) => i !== idx),
        };
      });
    },
    [setContactDraft],
  );

  return { addSubListItem, ensureSubListItem, updateSubListItem, removeSubListItem };
}
