import type { Contact } from "@mms/shared";

export type CustomCollectionRow = Record<string, unknown>;

/**
 * Read the array rows stored on a tenant custom-`custom_*` collection tab field.
 * SSOT for reading custom-collection rows (form edit + detail render).
 */
export function readContactCustomCollectionRows(
  contact: Partial<Contact>,
  tabId: string,
): CustomCollectionRow[] {
  const value = (contact as Record<string, unknown>)[tabId];
  return Array.isArray(value) ? (value as CustomCollectionRow[]) : [];
}
