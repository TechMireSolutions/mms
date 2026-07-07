import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact } from '@mms/shared';

const mockFindContactById = vi.fn();
const mockFindContactsByIds = vi.fn();
const mockListContactsByWorkspace = vi.fn();
const mockSaveContact = vi.fn();
const mockBulkSaveContacts = vi.fn();
const mockGetRequestTenant = vi.fn();
const mockInvalidateDuplicateScanCache = vi.fn();

vi.mock('../db/repositories/contactRepository.js', () => ({
  listContactsByWorkspace: (...args: unknown[]) => mockListContactsByWorkspace(...args),
  findContactById: (...args: unknown[]) => mockFindContactById(...args),
  saveContact: (...args: unknown[]) => mockSaveContact(...args),
  findContactsByIds: (...args: unknown[]) => mockFindContactsByIds(...args),
  bulkSaveContacts: (...args: unknown[]) => mockBulkSaveContacts(...args),
}));

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../services/contactDuplicateScanService.js', () => ({
  invalidateDuplicateScanCache: (...args: unknown[]) => mockInvalidateDuplicateScanCache(...args),
}));

vi.mock('../services/dbSyncService.js', () => ({
  fetchCollection: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/contactConfigService.js', () => ({
  loadContactFieldConfig: vi.fn().mockResolvedValue(null),
}));

import { updateContactById, upsertContact } from '../services/contactService.js';

function contact(overrides: Partial<Contact>): Contact {
  return {
    id: 'contact-1',
    name: 'Contact One',
    firstName: 'Contact',
    lastName: 'One',
    emergencyContacts: [],
    relationships: [],
    ...overrides,
  };
}

function link(contactId: string, relationship: string) {
  return expect.objectContaining({ contactId, relationship });
}

function inferredLink(contactId: string, relationship: string, inferenceDepth?: number) {
  return expect.objectContaining({
    contactId,
    relationship,
    inferred: true,
    ...(inferenceDepth ? { inferenceDepth } : {}),
  });
}

describe('contactService emergency reciprocal mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
    mockListContactsByWorkspace.mockResolvedValue([]);
    mockFindContactById.mockResolvedValue(null);
    mockFindContactsByIds.mockResolvedValue([]);
    mockSaveContact.mockResolvedValue(undefined);
    mockBulkSaveContacts.mockResolvedValue(undefined);
    mockInvalidateDuplicateScanCache.mockResolvedValue(undefined);
  });

  it('adds a reciprocal emergency link when creating a new contact', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      emergencyContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    const target = contact({
      id: 'b',
      name: 'Bilal Khan',
      firstName: 'Bilal',
      gender: 'Male',
      emergencyContacts: [],
    });
    mockFindContactsByIds.mockResolvedValue([target]);

    await upsertContact(source);

    expect(mockSaveContact).toHaveBeenCalledWith('demo', expect.objectContaining({ id: 'a' }));
    expect(mockFindContactsByIds).toHaveBeenCalledWith('demo', ['b']);
    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
    ]);
    expect(mockInvalidateDuplicateScanCache).toHaveBeenCalled();
  });

  it('updates the reciprocal emergency link when editing an existing contact', async () => {
    const existingSource = contact({
      id: 'a',
      name: 'Ahmed Khan',
      firstName: 'Ahmed',
      gender: 'Male',
    });
    const target = contact({
      id: 'b',
      name: 'Sara Khan',
      firstName: 'Sara',
      gender: 'Female',
      emergencyContacts: [
        { contactId: 'a', relationship: 'Other' },
        { contactId: 'c', relationship: 'Sister' },
      ],
    });
    mockFindContactById.mockResolvedValue(existingSource);
    mockFindContactsByIds.mockResolvedValue([target]);

    await updateContactById('a', {
      ...existingSource,
      emergencyContacts: [{ contactId: 'b', relationship: 'Son' }],
    });

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([
          inferredLink('a', 'Father', 1),
          link('c', 'Sister'),
        ]),
      }),
    ]);
  });

  it('maps sibling, spouse, guardian, and other reciprocal terms from source gender', async () => {
    const source = contact({
      id: 'a',
      name: 'Ahmed Khan',
      firstName: 'Ahmed',
      gender: 'Male',
      emergencyContacts: [
        { contactId: 'b', relationship: 'Sister' },
        { contactId: 'c', relationship: 'Spouse' },
        { contactId: 'd', relationship: 'Guardian' },
        { contactId: 'e', relationship: 'Other' },
      ],
    });
    mockFindContactsByIds.mockResolvedValue([
      contact({ id: 'b', name: 'Sibling', firstName: 'Sibling' }),
      contact({ id: 'c', name: 'Spouse', firstName: 'Spouse' }),
      contact({ id: 'd', name: 'Guardian', firstName: 'Guardian' }),
      contact({ id: 'e', name: 'Other', firstName: 'Other' }),
    ]);

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Brother', 1)]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Spouse', 1)]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Dependent', 1)]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Other', 1)]),
      }),
    ]);
  });

  it('infers grandparents, uncle or aunt, and cousins two nodes deep without extra manual entry', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      emergencyContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        emergencyContacts: [
          { contactId: 'c', relationship: 'Mother' },
          { contactId: 'd', relationship: 'Brother' },
        ],
      }),
      contact({ id: 'c', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
      contact({
        id: 'd',
        name: 'Danish Khan',
        firstName: 'Danish',
        gender: 'Male',
        emergencyContacts: [{ contactId: 'e', relationship: 'Daughter' }],
      }),
      contact({ id: 'e', name: 'Eman Khan', firstName: 'Eman', gender: 'Female' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          link('b', 'Father'),
          inferredLink('c', 'Grandmother', 2),
          inferredLink('d', 'Uncle', 2),
          inferredLink('e', 'Cousin', 3),
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Granddaughter', 2)]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Niece', 2)]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Cousin', 3)]),
      }),
    ]));
  });

  it('infers in-law relationships through a spouse primary relationship', async () => {
    const source = contact({
      id: 'a',
      name: 'Ahmed Khan',
      firstName: 'Ahmed',
      gender: 'Male',
      emergencyContacts: [{ contactId: 'b', relationship: 'Spouse' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Sara Khan',
        firstName: 'Sara',
        gender: 'Female',
        emergencyContacts: [
          { contactId: 'c', relationship: 'Father' },
          { contactId: 'd', relationship: 'Sister' },
        ],
      }),
      contact({ id: 'c', name: 'Bilal Khan', firstName: 'Bilal', gender: 'Male' }),
      contact({ id: 'd', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Spouse', 1)]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          link('b', 'Spouse'),
          inferredLink('c', 'Father-In-Law', 2),
          inferredLink('d', 'Sister-In-Law', 2),
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Son-In-Law', 2)]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Brother-In-Law', 2)]),
      }),
    ]));
  });

  it('infers co-parent and sibling network joins without duplicate manual entry', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      emergencyContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        emergencyContacts: [
          { contactId: 'c', relationship: 'Spouse' },
          { contactId: 'd', relationship: 'Sister' },
        ],
      }),
      contact({ id: 'c', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
      contact({
        id: 'd',
        name: 'Eman Khan',
        firstName: 'Eman',
        gender: 'Female',
        emergencyContacts: [{ contactId: 'e', relationship: 'Son' }],
      }),
      contact({ id: 'e', name: 'Omar Khan', firstName: 'Omar', gender: 'Male' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          link('b', 'Father'),
          inferredLink('c', 'Mother', 2),
          inferredLink('d', 'Aunt', 2),
          inferredLink('e', 'Cousin', 3),
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 2)]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Cousin', 3)]),
      }),
    ]));
  });

  it('infers additional children and siblings from child and sibling primary links', async () => {
    const source = contact({
      id: 'a',
      name: 'Ahmed Khan',
      firstName: 'Ahmed',
      gender: 'Male',
      emergencyContacts: [
        { contactId: 'b', relationship: 'Son' },
        { contactId: 'd', relationship: 'Brother' },
      ],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        emergencyContacts: [{ contactId: 'c', relationship: 'Sister' }],
      }),
      contact({ id: 'c', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
      contact({
        id: 'd',
        name: 'Danish Khan',
        firstName: 'Danish',
        gender: 'Male',
        emergencyContacts: [{ contactId: 'e', relationship: 'Sister' }],
      }),
      contact({ id: 'e', name: 'Eman Khan', firstName: 'Eman', gender: 'Female' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          link('b', 'Son'),
          link('d', 'Brother'),
          inferredLink('c', 'Daughter', 2),
          inferredLink('e', 'Sister', 2),
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Father', 2)]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Brother', 2)]),
      }),
    ]));
  });

  it('uses neutral relationship labels when gender is unavailable', async () => {
    const source = contact({
      id: 'a',
      name: 'Unknown Source',
      firstName: 'Unknown',
      gender: '',
      emergencyContacts: [{ contactId: 'b', relationship: 'Parent' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Unknown Parent',
        firstName: 'Unknown',
        gender: '',
        emergencyContacts: [
          { contactId: 'c', relationship: 'Parent' },
          { contactId: 'd', relationship: 'Sibling' },
        ],
      }),
      contact({ id: 'c', name: 'Unknown Grandparent', firstName: 'Unknown', gender: '' }),
      contact({ id: 'd', name: 'Unknown Aunt Uncle', firstName: 'Unknown', gender: '' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Child', 1)]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          link('b', 'Parent'),
          inferredLink('c', 'Grandparent', 2),
          inferredLink('d', 'Aunt/Uncle', 2),
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Grandchild', 2)]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Niece/Nephew', 2)]),
      }),
    ]));
  });

  it('does not overwrite an existing direct relationship with an inferred relationship', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      emergencyContacts: [
        { contactId: 'b', relationship: 'Father' },
        { contactId: 'c', relationship: 'Guardian' },
      ],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        emergencyContacts: [{ contactId: 'c', relationship: 'Mother' }],
      }),
      contact({ id: 'c', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Dependent', 1)]),
      }),
    ]);
    expect(mockBulkSaveContacts).not.toHaveBeenCalledWith(
      'demo',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'a',
          emergencyContacts: expect.arrayContaining([inferredLink('c', 'Grandmother', 2)]),
        }),
      ]),
    );
  });

  it('does not infer a relationship pair when the other contact already has an explicit direct link', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      emergencyContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        emergencyContacts: [{ contactId: 'c', relationship: 'Mother' }],
      }),
      contact({
        id: 'c',
        name: 'Nadia Khan',
        firstName: 'Nadia',
        gender: 'Female',
        emergencyContacts: [{ contactId: 'a', relationship: 'Guardian' }],
      }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
    ]);
    expect(mockBulkSaveContacts).not.toHaveBeenCalledWith(
      'demo',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'a',
          emergencyContacts: expect.arrayContaining([inferredLink('c', 'Grandmother', 2)]),
        }),
        expect.objectContaining({
          id: 'c',
          emergencyContacts: expect.arrayContaining([inferredLink('a', 'Granddaughter', 2)]),
        }),
      ]),
    );
  });

  it('uses saved relationship links as inference triggers too', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      relationships: [{ contactId: 'b', relationship: 'Father' }],
    });
    const family = [
      contact({
        id: 'b',
        name: 'Bilal Khan',
        firstName: 'Bilal',
        gender: 'Male',
        relationships: [{ contactId: 'c', relationship: 'Mother' }],
      }),
      contact({ id: 'c', name: 'Nadia Khan', firstName: 'Nadia', gender: 'Female' }),
    ];
    mockFindContactsByIds.mockImplementation((_tenant: string, ids: string[]) =>
      Promise.resolve(family.filter((entry) => ids.includes(String(entry.id)))),
    );

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', expect.arrayContaining([
      expect.objectContaining({
        id: 'b',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([inferredLink('c', 'Grandmother', 2)]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([inferredLink('a', 'Granddaughter', 2)]),
      }),
    ]));
  });
});
