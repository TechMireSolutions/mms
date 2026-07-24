import { type Contact, getDisplayName, getPrimaryPhone, getPrimaryEmail } from '@mms/shared';

/** Extract sortable value from a contact instance for a given column or property field. */
export function getContactSortValue(contact: Contact, field: string): string | number {
  if (field === 'name') return getDisplayName(contact).toLowerCase();
  if (field === 'phone') return getPrimaryPhone(contact) || '';
  if (field === 'email') return getPrimaryEmail(contact) || '';

  const raw = (contact as unknown as Record<string, unknown>)[field];
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return raw.toLowerCase();
  return String(raw ?? '').toLowerCase();
}

/** Pure helper to sort contacts by field and direction. */
export function sortContacts(
  contacts: Contact[],
  sortField: string,
  sortDir: 'asc' | 'desc',
): Contact[] {
  return [...contacts].sort((a, b) => {
    const av = getContactSortValue(a, sortField);
    const bv = getContactSortValue(b, sortField);
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}
