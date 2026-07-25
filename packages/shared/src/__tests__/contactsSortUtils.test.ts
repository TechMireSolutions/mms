import { describe, expect, it } from 'vitest';
import type { Contact } from '../contactTypes.js';
import { getContactSortValue, sortContacts } from '../contactsSortUtils.js';

describe('contactsSortUtils', () => {
  const dummyContacts: Contact[] = [
    {
      id: '1',
      name: 'Zara Ahmed',
      firstName: 'Zara',
      lastName: 'Ahmed',
      gender: 'female',
      phones: [{ label: 'Mobile', number: '03001234567', isPrimary: true }],
      emails: [{ label: 'Personal', address: 'zara@example.com', isPrimary: true }],
    },
    {
      id: '2',
      name: 'Ali Hassan',
      firstName: 'Ali',
      lastName: 'Hassan',
      gender: 'male',
      phones: [{ label: 'Mobile', number: '03009876543', isPrimary: true }],
      emails: [{ label: 'Personal', address: 'ali@example.com', isPrimary: true }],
    },
    {
      id: '3',
      name: 'Bilal Khan',
      firstName: 'Bilal',
      lastName: 'Khan',
      gender: 'male',
      phones: [{ label: 'Mobile', number: '03005555555', isPrimary: true }],
      emails: [{ label: 'Personal', address: 'bilal@example.com', isPrimary: true }],
    },
  ];

  it('extracts correct sortable values for name, phone, and email', () => {
    expect(getContactSortValue(dummyContacts[0], 'name')).toBe('zara ahmed');
    expect(getContactSortValue(dummyContacts[0], 'phone')).toBe('+92 3001234567');
    expect(getContactSortValue(dummyContacts[0], 'email')).toBe('zara@example.com');
  });

  it('sorts contacts by name ascending and descending', () => {
    const asc = sortContacts(dummyContacts, 'name', 'asc');
    expect(asc.map((c) => c.name)).toEqual(['Ali Hassan', 'Bilal Khan', 'Zara Ahmed']);

    const desc = sortContacts(dummyContacts, 'name', 'desc');
    expect(desc.map((c) => c.name)).toEqual(['Zara Ahmed', 'Bilal Khan', 'Ali Hassan']);
  });

  it('sorts contacts by email ascending', () => {
    const sorted = sortContacts(dummyContacts, 'email', 'asc');
    expect(sorted.map((c) => c.name)).toEqual(['Ali Hassan', 'Bilal Khan', 'Zara Ahmed']);
  });
});
