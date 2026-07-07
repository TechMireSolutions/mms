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
        emergencyContacts: [{ contactId: 'a', relationship: 'Daughter' }],
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
        emergencyContacts: [
          { contactId: 'a', relationship: 'Father' },
          { contactId: 'c', relationship: 'Sister' },
        ],
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
        emergencyContacts: [{ contactId: 'a', relationship: 'Brother' }],
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: [{ contactId: 'a', relationship: 'Spouse' }],
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: [{ contactId: 'a', relationship: 'Dependent' }],
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: [{ contactId: 'a', relationship: 'Other' }],
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
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Daughter' }]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          { contactId: 'b', relationship: 'Father' },
          { contactId: 'c', relationship: 'Grandmother' },
          { contactId: 'd', relationship: 'Uncle' },
          { contactId: 'e', relationship: 'Cousin' },
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Granddaughter' }]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Niece' }]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Cousin' }]),
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
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Spouse' }]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          { contactId: 'b', relationship: 'Spouse' },
          { contactId: 'c', relationship: 'Father-In-Law' },
          { contactId: 'd', relationship: 'Sister-In-Law' },
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Son-In-Law' }]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Brother-In-Law' }]),
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
          { contactId: 'b', relationship: 'Father' },
          { contactId: 'c', relationship: 'Mother' },
          { contactId: 'd', relationship: 'Aunt' },
          { contactId: 'e', relationship: 'Cousin' },
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Daughter' }]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Cousin' }]),
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
          { contactId: 'b', relationship: 'Son' },
          { contactId: 'd', relationship: 'Brother' },
          { contactId: 'c', relationship: 'Daughter' },
          { contactId: 'e', relationship: 'Sister' },
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Father' }]),
      }),
      expect.objectContaining({
        id: 'e',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Brother' }]),
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
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Child' }]),
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: expect.arrayContaining([
          { contactId: 'b', relationship: 'Parent' },
          { contactId: 'c', relationship: 'Grandparent' },
          { contactId: 'd', relationship: 'Aunt/Uncle' },
        ]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Grandchild' }]),
      }),
      expect.objectContaining({
        id: 'd',
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Niece/Nephew' }]),
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
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Daughter' }]),
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: [{ contactId: 'a', relationship: 'Dependent' }],
      }),
    ]);
    expect(mockBulkSaveContacts).not.toHaveBeenCalledWith(
      'demo',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'a',
          emergencyContacts: expect.arrayContaining([{ contactId: 'c', relationship: 'Grandmother' }]),
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
        emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Daughter' }]),
      }),
    ]);
    expect(mockBulkSaveContacts).not.toHaveBeenCalledWith(
      'demo',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'a',
          emergencyContacts: expect.arrayContaining([{ contactId: 'c', relationship: 'Grandmother' }]),
        }),
        expect.objectContaining({
          id: 'c',
          emergencyContacts: expect.arrayContaining([{ contactId: 'a', relationship: 'Granddaughter' }]),
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
        emergencyContacts: [{ contactId: 'a', relationship: 'Daughter' }],
      }),
      expect.objectContaining({
        id: 'a',
        emergencyContacts: [{ contactId: 'c', relationship: 'Grandmother' }],
      }),
      expect.objectContaining({
        id: 'c',
        emergencyContacts: [{ contactId: 'a', relationship: 'Granddaughter' }],
      }),
    ]));
  });
});
