import { describe, expect, it } from 'vitest';
import { filterContactsForQuery } from '../contactsListQuery.js';
import type { Contact } from '../contactTypes.js';

function contact(partial: Partial<Contact> & Pick<Contact, 'id' | 'name'>): Contact {
  return {
    firstName: '',
    lastName: '',
    ...partial,
  } as Contact;
}

describe('filterContactsForQuery gender', () => {
  const rows = [
    contact({ id: '1', name: 'John Doe', gender: 'Male' }),
    contact({ id: '2', name: 'Jane Doe', gender: 'female' }),
    contact({ id: '3', name: 'Alex', gender: 'male' }),
  ];

  it('matches gender case-insensitively', () => {
    const male = filterContactsForQuery(rows, { gender: 'male' });
    expect(male.map((row) => row.id).sort()).toEqual(['1', '3']);

    const female = filterContactsForQuery(rows, { gender: 'Female' });
    expect(female.map((row) => row.id)).toEqual(['2']);
  });
});

describe('filterContactsForQuery quickFilter', () => {
  const rows = [
    contact({
      id: '1',
      name: 'Wa Syed',
      isSyed: true,
      phones: [{ label: 'Mobile', number: '+10000000001' }],
      emails: [{ label: 'Personal', address: 'a@example.com' }],
    }),
    contact({
      id: '2',
      name: 'Missing Both',
      phones: [],
      emails: [],
    }),
    contact({
      id: '3',
      name: 'Phone Only',
      phones: [{ label: 'Mobile', number: '+10000000003' }],
      emails: [],
    }),
  ];

  it('filters whatsapp / syed / missingInfo presets', () => {
    expect(filterContactsForQuery(rows, { quickFilter: 'whatsapp' }).map((row) => row.id).sort()).toEqual([
      '1',
      '3',
    ]);
    expect(filterContactsForQuery(rows, { quickFilter: 'syed' }).map((row) => row.id)).toEqual(['1']);
    expect(filterContactsForQuery(rows, { quickFilter: 'missingInfo' }).map((row) => row.id).sort()).toEqual([
      '2',
      '3',
    ]);
  });
});
