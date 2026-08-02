import { useCallback, type Dispatch, type SetStateAction } from "react";
import { ensureSinglePrimaryFlag, type Contact, type PhoneNumber } from "@mms/shared";
import type {
  AddSubListItem,
  ContactSubListKey,
  EnsureSubListItem,
  RemoveSubListItem,
  UpdateSubListItem,
} from "@/tenant/features/contacts/components/formTabs/types";

function withHealedPrimary(
  fieldKey: ContactSubListKey,
  list: unknown[],
): unknown[] {
  if (fieldKey !== "phones" && fieldKey !== "emails") return list;
  return ensureSinglePrimaryFlag(list as Array<{ isPrimary?: boolean }>);
}

export function useContactFormSubLists(
  setContactDraft: Dispatch<SetStateAction<Partial<Contact>>>,
) {
  const addSubListItem = useCallback<AddSubListItem>(
    (fieldKey, newItem) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        return {
          ...prev,
          [fieldKey]: withHealedPrimary(fieldKey, [...currentList, newItem]),
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
        return { ...prev, [fieldKey]: withHealedPrimary(fieldKey, [newItem]) };
      });
    },
    [setContactDraft],
  );

  const updateSubListItem = useCallback<UpdateSubListItem>(
    (fieldKey, idx, patch) => {
      setContactDraft((prev) => {
        const currentList = (prev[fieldKey] as NonNullable<Contact[typeof fieldKey]>) || [];
        const nextList = currentList.map((item, i) => {
          if (i !== idx) return item;
          if (fieldKey === "phones" && "number" in patch) {
            const phone = item as PhoneNumber;
            const { whatsappStatus: _cleared, ...rest } = phone;
            void _cleared;
            return { ...rest, ...patch };
          }
          return { ...item, ...patch };
        });
        return { ...prev, [fieldKey]: withHealedPrimary(fieldKey, nextList) };
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
          [fieldKey]: withHealedPrimary(
            fieldKey,
            currentList.filter((_, i) => i !== idx),
          ),
        };
      });
    },
    [setContactDraft],
  );

  return { addSubListItem, ensureSubListItem, updateSubListItem, removeSubListItem };
}
