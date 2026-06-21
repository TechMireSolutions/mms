/** Report segment → Work directory drill-down (globle1.md §4.3). */

export const CONTACTS_WORK_DRILLDOWN_EVENT = 'contacts-work-drilldown';

export type { ContactsWorkDrillDown } from '@mms/shared';
import type { ContactsWorkDrillDown } from '@mms/shared';

const STORAGE_KEY = 'mms_contacts_work_drilldown';

export function applyContactsWorkDrillDown(filter: ContactsWorkDrillDown): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  window.dispatchEvent(new CustomEvent(CONTACTS_WORK_DRILLDOWN_EVENT, { detail: filter }));
}

export function consumeContactsWorkDrillDown(): ContactsWorkDrillDown | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as ContactsWorkDrillDown;
  } catch {
    return null;
  }
}
