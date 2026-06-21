import { describe, expect, it } from 'vitest';
import type { Contact } from '../contactTypes.js';
import { contactMatchesSearch, getContactSearchHaystack } from '../contactsSearchUtils.js';

describe('contactsSearchUtils', () => {
  it('matches name and email in search haystack', () => {
    const contact = {
      id: '1',
      name: 'Ali Khan',
      emails: [{ label: 'Work', address: 'ali@example.com' }],
    } as Contact;
    expect(getContactSearchHaystack(contact)).toContain('ali@example.com');
    expect(contactMatchesSearch(contact, 'ali@')).toBe(true);
    expect(contactMatchesSearch(contact, 'missing')).toBe(false);
  });
});
