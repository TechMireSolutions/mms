import type { Contact } from "@mms/shared";

export type ContactSubListKey = "phones" | "emails" | "addresses" | "socials" | "relationshipContacts";

export type AddSubListItem = <K extends ContactSubListKey>(
  fieldKey: K,
  newItem: NonNullable<Contact[K]>[number],
) => void;

export type EnsureSubListItem = <K extends ContactSubListKey>(
  fieldKey: K,
  newItem: NonNullable<Contact[K]>[number],
) => void;

export type UpdateSubListItem = <K extends ContactSubListKey>(
  fieldKey: K,
  idx: number,
  patch: Partial<NonNullable<Contact[K]>[number]>,
) => void;

export type RemoveSubListItem = (fieldKey: ContactSubListKey, idx: number) => void;

export interface ContactSubListMutationProps {
  addSubListItem: AddSubListItem;
  ensureSubListItem: EnsureSubListItem;
  updateSubListItem: UpdateSubListItem;
  removeSubListItem: RemoveSubListItem;
}

export interface ContactSubListTabBaseProps extends ContactSubListMutationProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isFieldRequired: (tabId: string, fieldId: string) => boolean;
}
