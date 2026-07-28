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
    contact({ id: '4', name: 'Sam', gender: '' }),
    contact({ id: '5', name: 'Pat', gender: 'unspecified' }),
  ];

  it('matches gender case-insensitively', () => {
    const male = filterContactsForQuery(rows, { gender: 'male' });
    expect(male.map((row) => row.id).sort()).toEqual(['1', '3']);

    const female = filterContactsForQuery(rows, { gender: 'Female' });
    expect(female.map((row) => row.id)).toEqual(['2']);
  });

  it('treats empty gender as unspecified', () => {
    expect(filterContactsForQuery(rows, { gender: 'unspecified' }).map((row) => row.id).sort()).toEqual([
      '4',
      '5',
    ]);
  });
});

describe('filterContactsForQuery hasReachable', () => {
  const rows = [
    contact({
      id: '1',
      name: 'Phone',
      phones: [{ label: 'Mobile', number: '+15551234567' }],
    }),
    contact({
      id: '2',
      name: 'Email',
      emails: [{ label: 'Personal', address: 'a@example.com' }],
    }),
    contact({ id: '3', name: 'Neither', phones: [], emails: [] }),
  ];

  it('keeps contacts with phone or email', () => {
    expect(filterContactsForQuery(rows, { hasReachable: true }).map((row) => row.id).sort()).toEqual([
      '1',
      '2',
    ]);
  });

  it('filters hasPhone and hasEmail separately', () => {
    expect(filterContactsForQuery(rows, { hasPhone: true }).map((row) => row.id)).toEqual(['1']);
    expect(filterContactsForQuery(rows, { hasEmail: true }).map((row) => row.id)).toEqual(['2']);
  });
});

describe('filterContactsForQuery quickFilter', () => {
  const rows = [
    contact({
      id: '1',
      name: 'Wa Syed',
      isSyed: true,
      phones: [{ label: 'Mobile', number: '+923001111111' }],
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
      phones: [{ label: 'Mobile', number: '+15551234567' }],
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

describe('filterContactsForQuery excludeIds', () => {
  const rows = [
    contact({ id: '1', name: 'Ali' }),
    contact({ id: '2', name: 'Sara' }),
    contact({ id: '3', name: 'Hassan' }),
  ];

  it('omits excluded contact ids', () => {
    expect(filterContactsForQuery(rows, { excludeIds: ['2', 3] }).map((row) => row.id)).toEqual(['1']);
  });
});

describe('filterContactsForQuery soft deletion', () => {
  const rows = [
    contact({ id: 'active', name: 'Active Contact' }),
    contact({
      id: 'deleted',
      name: 'Deleted Contact',
      deletedAt: '2026-07-27T00:00:00.000Z',
    }),
  ];

  it('returns active contacts by default and deleted contacts for trash queries', () => {
    expect(filterContactsForQuery(rows, {}).map((row) => row.id)).toEqual(['active']);
    expect(filterContactsForQuery(rows, { includeDeleted: true }).map((row) => row.id)).toEqual([
      'deleted',
    ]);
  });
});
