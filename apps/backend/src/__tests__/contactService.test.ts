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
});
