import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Teacher } from '@mms/shared';

const mockLoadContactsByIdsForTenant = vi.fn();

vi.mock('../contacts/use-cases/contactUseCases.js', () => ({
  contactUseCases: {
    loadContactsByIdsForTenant: (...args: unknown[]) =>
      mockLoadContactsByIdsForTenant(...args),
  },
}));

import { hydrateTeachersFromContacts } from '../teachers/use-cases/teacherHydrateUseCases.js';

type ContactRow = {
  id: string;
  name?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  city?: string;
  avatar?: string | null;
  phones?: Array<{ number?: string }>;
  emails?: Array<{ address?: string }>;
};

function fakeTeacher(id: string, overrides: Partial<Teacher> = {}): Teacher {
  return {
    id,
    contactId: `c-${id}`,
    name: `Teacher ${id}`,
    status: 'active',
    ...overrides,
  };
}

function mockContactStore(contacts: ContactRow[]): void {
  mockLoadContactsByIdsForTenant.mockImplementation(
    async (_tenant: string, ids: string[]) => {
      const wanted = new Set(ids.map(String));
      return contacts.filter((contact) => wanted.has(String(contact.id)));
    },
  );
}

describe('hydrateTeachersFromContacts', () => {
  beforeEach(() => {
    mockLoadContactsByIdsForTenant.mockReset();
  });

  it('returns [] for empty rows without loading contacts', async () => {
    await expect(hydrateTeachersFromContacts('demo', [])).resolves.toEqual([]);
    expect(mockLoadContactsByIdsForTenant).not.toHaveBeenCalled();
  });

  it('returns rows unchanged when no row has a contactId', async () => {
    const rows = [fakeTeacher('t1', { contactId: '' }), fakeTeacher('t2', { contactId: '' })];
    const result = await hydrateTeachersFromContacts('demo', rows);

    expect(result).toEqual(rows);
    expect(mockLoadContactsByIdsForTenant).not.toHaveBeenCalled();
  });

  it('hydrates profile fields from the linked contact', async () => {
    mockContactStore([
      {
        id: 'c-t1',
        name: 'Ahmed Ali',
        gender: 'male',
        dob: '1985-06-01',
        phone: '+123456',
        email: 'ahmed@example.com',
        city: 'Karachi',
      },
    ]);

    const result = await hydrateTeachersFromContacts('demo', [fakeTeacher('t1')]);

    expect(result[0]?.name).toBe('Ahmed Ali');
    expect(result[0]?.gender).toBe('male');
    expect(result[0]?.dob).toBe('1985-06-01');
    expect(result[0]?.phone).toBe('+123456');
    expect(result[0]?.email).toBe('ahmed@example.com');
    expect(result[0]?.city).toBe('Karachi');
    expect(mockLoadContactsByIdsForTenant).toHaveBeenCalledWith('demo', ['c-t1']);
  });

  it('resolves phone/email from contact detail arrays when scalar fields are empty', async () => {
    mockContactStore([
      {
        id: 'c-t1',
        name: 'Ahmed Ali',
        phones: [{ number: '+987654' }],
        emails: [{ address: 'ahmed@school.org' }],
      },
    ]);

    const result = await hydrateTeachersFromContacts('demo', [fakeTeacher('t1')]);

    expect(result[0]?.phone).toBe('+987654');
    expect(result[0]?.email).toBe('ahmed@school.org');
  });

  it('hydrates the canonical avatar from the linked contact', async () => {
    mockContactStore([
      { id: 'c-t1', name: 'Ahmed Ali', avatar: 'https://cdn.example/avatar.png' },
    ]);

    const result = await hydrateTeachersFromContacts('demo', [fakeTeacher('t1')]);

    expect(result[0]?.avatar).toBe('https://cdn.example/avatar.png');
  });

  it('batches ids across rows in a single load', async () => {
    mockContactStore([
      { id: 'c-t1', name: 'Ahmed Ali' },
      { id: 'c-t2', name: 'Fatima Noor' },
    ]);

    const result = await hydrateTeachersFromContacts('demo', [
      fakeTeacher('t1'),
      fakeTeacher('t2'),
    ]);

    expect(result.map((row) => row.name)).toEqual(['Ahmed Ali', 'Fatima Noor']);
    expect(mockLoadContactsByIdsForTenant).toHaveBeenCalledTimes(1);
    expect(mockLoadContactsByIdsForTenant).toHaveBeenCalledWith(
      'demo',
      expect.arrayContaining(['c-t1', 'c-t2']),
    );
  });
});
