import type { Contact, FieldDefinition } from "@mms/shared";

export type ContactSubListKey =
  | "phones"
  | "emails"
  | "addresses"
  | "socials"
  | "education"
  | "experience"
  | "skills"
  | "relationshipContacts"
  | (string & {});

export type AddSubListItem = <T extends object = Record<string, unknown>>(
  fieldKey: ContactSubListKey,
  newItem: T,
) => void;

export type EnsureSubListItem = <T extends object = Record<string, unknown>>(
  fieldKey: ContactSubListKey,
  newItem: T,
) => void;

/** Patch may include Setup custom field keys beyond the typed system shape. */
export type UpdateSubListItem = <T extends object = Record<string, unknown>>(
  fieldKey: ContactSubListKey,
  idx: number,
  patch: Partial<T> & Record<string, unknown>,
) => void;

export type RemoveSubListItem = (fieldKey: ContactSubListKey, idx: number) => void;

interface ContactSubListMutationProps {
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
  fields: Record<string, FieldDefinition[]>;
  formInstanceId: string;
}
