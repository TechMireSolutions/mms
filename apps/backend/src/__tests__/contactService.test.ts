import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact } from '@mms/shared';

const mockFindContactById = vi.fn();
const mockFindContactsByIds = vi.fn();
const mockListContactsByWorkspace = vi.fn();
const mockListContactsPage = vi.fn();
const mockSaveContact = vi.fn();
const mockBulkSaveContacts = vi.fn();
const mockGetRequestTenant = vi.fn();
const mockInvalidateDuplicateScanCache = vi.fn();

const mockAssertContactUniqueFields = vi.fn();

vi.mock('../db/repositories/contactRepository.js', () => ({
  listContactsByWorkspace: (...args: unknown[]) => mockListContactsByWorkspace(...args),
  listContactsPage: (...args: unknown[]) => mockListContactsPage(...args),
  findContactById: (...args: unknown[]) => mockFindContactById(...args),
  saveContact: (...args: unknown[]) => mockSaveContact(...args),
  findContactsByIds: (...args: unknown[]) => mockFindContactsByIds(...args),
  bulkSaveContacts: (...args: unknown[]) => mockBulkSaveContacts(...args),
}));

vi.mock('../services/contactUniqueValidationService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/contactUniqueValidationService.js')>();
  return {
    ...actual,
    assertContactUniqueFields: (...args: unknown[]) => mockAssertContactUniqueFields(...args),
  };
});

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../services/contactDuplicateScanService.js', () => ({
  invalidateDuplicateScanCache: (...args: unknown[]) => mockInvalidateDuplicateScanCache(...args),
}));

vi.mock('../services/dbSyncService.js', () => ({
  fetchCollection: vi.fn().mockResolvedValue([]),
  fetchObject: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/contactConfigService.js', () => ({
  loadContactFieldConfig: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/contactLookupsService.js', () => ({
  loadContactLookupKind: vi.fn().mockResolvedValue([]),
}));

const mockLoadContactPreferences = vi.fn();
vi.mock('../services/contactPreferencesService.js', () => ({
  loadContactPreferences: (...args: unknown[]) => mockLoadContactPreferences(...args),
}));

vi.mock('../db/database.js', () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

import {
  loadContactsPage,
  updateContactById,
  upsertContact,
  bulkSoftDeleteContacts,
  restoreContactById,
  bulkRestoreContacts,
  ContactUniqueFieldError,
} from '../services/contactService.js';
import { applyContactRelationshipInference } from '../services/contactRelationshipInferenceService.js';


function contact(overrides: Partial<Contact>): Contact {
  return {
    id: 'contact-1',
    name: 'Contact One',
    firstName: 'Contact',
    lastName: 'One',
    relationshipContacts: [],
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

/** Pair fixtures for reciprocal depth-1 tests only (no depth-2/3 ontology). */
const DEFAULT_TEST_RELATIONSHIP_PAIRS = [
  { id: 'p1', forward: 'Father', inverse: 'Child', inverseMale: 'Son', inverseFemale: 'Daughter' },
  { id: 'p2', forward: 'Mother', inverse: 'Child', inverseMale: 'Son', inverseFemale: 'Daughter' },
  { id: 'p4', forward: 'Brother', inverse: 'Sibling', inverseMale: 'Brother', inverseFemale: 'Sister' },
  { id: 'p5', forward: 'Sister', inverse: 'Sibling', inverseMale: 'Brother', inverseFemale: 'Sister' },
  { id: 'p7', forward: 'Husband', inverse: 'Spouse', inverseMale: 'Husband', inverseFemale: 'Wife' },
  { id: 'p9', forward: 'Spouse', inverse: 'Spouse', inverseMale: 'Husband', inverseFemale: 'Wife' },
  { id: 'p10', forward: 'Guardian', inverse: 'Dependent' },
  { id: 'p22', forward: 'Other', inverse: 'Other' },
  { id: 'p23', forward: 'Mentor', inverse: 'Mentor' },
];

describe('contactService relationship reciprocal mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
    mockLoadContactPreferences.mockImplementation(async () => ({
      relationshipPairs: DEFAULT_TEST_RELATIONSHIP_PAIRS,
    }));
    mockListContactsByWorkspace.mockResolvedValue([]);
    mockListContactsPage.mockResolvedValue({
      contacts: [],
      total: 0,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    mockFindContactById.mockResolvedValue(null);
    mockFindContactsByIds.mockResolvedValue([]);
    mockSaveContact.mockResolvedValue(undefined);
    mockBulkSaveContacts.mockResolvedValue(undefined);
    mockInvalidateDuplicateScanCache.mockResolvedValue(undefined);
    mockAssertContactUniqueFields.mockReset().mockResolvedValue(undefined);
  });

  it('returns only deleted contacts for trash pages', async () => {
    mockListContactsPage.mockResolvedValue({
      contacts: [contact({ id: 'deleted', deletedAt: '2026-07-27T00:00:00.000Z' })],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });

    const page = await loadContactsPage({ page: 1, limit: 50, includeDeleted: true });

    expect(mockListContactsPage).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ page: 1, limit: 50, includeDeleted: true }),
    );
    expect(page.contacts.map((entry) => entry.id)).toEqual(['deleted']);
    expect(page.total).toBe(1);
  });

  it('excludeLinkedModules is forwarded to SQL listContactsPage', async () => {
    mockListContactsPage.mockResolvedValue({
      contacts: [],
      total: 0,
      page: 1,
      limit: 50,
      hasMore: false,
    });

    await loadContactsPage({
      page: 1,
      limit: 50,
      excludeLinkedModules: ['students', 'teachers'],
    });

    expect(mockListContactsPage).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({
        page: 1,
        limit: 50,
        excludeLinkedModules: ['students', 'teachers'],
      }),
    );
  });

  it('restoreContactById asserts uniqueness before clearing soft-delete', async () => {
    const deleted = contact({
      id: 'c1',
      deletedAt: '2026-07-27T00:00:00.000Z',
      phones: [{ label: 'Mobile', number: '3001112233', countryCode: '+92' }],
    });
    mockFindContactById.mockResolvedValue(deleted);

    const restored = await restoreContactById('c1', 'u-admin');

    expect(mockAssertContactUniqueFields).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ id: 'c1', deletedAt: undefined }),
      'en',
    );
    expect(mockSaveContact).toHaveBeenCalled();
    expect(restored?.deletedAt).toBeUndefined();
  });

  it('restoreContactById surfaces unique conflicts', async () => {
    mockFindContactById.mockResolvedValue(
      contact({ id: 'c1', deletedAt: '2026-07-27T00:00:00.000Z' }),
    );
    mockAssertContactUniqueFields.mockRejectedValue(
      new ContactUniqueFieldError([{ fieldId: 'number', tabId: 'phones', message: 'must be unique' }]),
    );

    await expect(restoreContactById('c1', 'u-admin')).rejects.toBeInstanceOf(ContactUniqueFieldError);
    expect(mockSaveContact).not.toHaveBeenCalled();
  });

  it('bulkRestoreContacts skips unique conflicts', async () => {
    mockFindContactsByIds.mockResolvedValue([
      contact({ id: 'c1', deletedAt: '2026-07-27T00:00:00.000Z' }),
      contact({ id: 'c2', deletedAt: '2026-07-27T00:00:00.000Z' }),
    ]);
    mockAssertContactUniqueFields
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        new ContactUniqueFieldError([{ fieldId: 'number', tabId: 'phones', message: 'must be unique' }]),
      );

    const result = await bulkRestoreContacts(['c1', 'c2'], 'u-admin');

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.conflicts).toEqual([
      expect.objectContaining({ id: 'c2' }),
    ]);
    expect(mockBulkSaveContacts).toHaveBeenCalledWith(
      'demo',
      [expect.objectContaining({ id: 'c1', deletedAt: undefined })],
    );
  });

  it('adds a reciprocal relationship link when creating a new contact', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      relationshipContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    const target = contact({
      id: 'b',
      name: 'Bilal Khan',
      firstName: 'Bilal',
      gender: 'Male',
      relationshipContacts: [],
    });
    mockFindContactsByIds.mockResolvedValue([target]);

    await upsertContact(source);

    expect(mockSaveContact).toHaveBeenCalledWith('demo', expect.objectContaining({ id: 'a' }));
    expect(mockFindContactsByIds).toHaveBeenCalledWith('demo', ['b']);
    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
    ]);
    expect(mockInvalidateDuplicateScanCache).toHaveBeenCalled();
  });

  it('creates reciprocal 2-sided relationship links for dynamic relationship types', async () => {
    const source = contact({
      id: 'a',
      name: 'Dr. Tariq',
      firstName: 'Tariq',
      gender: 'Male',
      relationshipContacts: [{ contactId: 'b', relationship: 'Mentor' }],
    });
    const target = contact({
      id: 'b',
      name: 'Zayn Ahmad',
      firstName: 'Zayn',
      gender: 'Male',
      relationshipContacts: [],
    });
    mockFindContactsByIds.mockResolvedValue([target]);

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Mentor', 1)]),
      }),
    ]);
  });

  it('uses configured dynamic relationship pairs for custom reciprocal link creation', async () => {
    const source = contact({
      id: 'a',
      name: 'Dr. Tariq',
      firstName: 'Tariq',
      gender: 'Male',
      relationshipContacts: [{ contactId: 'b', relationship: 'Mentor' }],
    });
    const target = contact({
      id: 'b',
      name: 'Zayn Ahmad',
      firstName: 'Zayn',
      gender: 'Male',
      relationshipContacts: [],
    });
    mockFindContactsByIds.mockResolvedValue([target]);

    await applyContactRelationshipInference('demo', source, [
      { id: 'm1', forward: 'Mentor', inverse: 'Mentee' },
    ]);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Mentee', 1)]),
      }),
    ]);
  });



  it('updates the reciprocal relationship link when editing an existing contact', async () => {
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
      relationshipContacts: [
        { contactId: 'a', relationship: 'Other' },
        { contactId: 'c', relationship: 'Sister' },
      ],
    });
    mockFindContactById.mockResolvedValue(existingSource);
    mockFindContactsByIds.mockResolvedValue([target]);

    await updateContactById('a', {
      ...existingSource,
      relationshipContacts: [{ contactId: 'b', relationship: 'Son' }],
    });

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        relationshipContacts: expect.arrayContaining([
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
      relationshipContacts: [
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
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Brother', 1)]),
      }),
      expect.objectContaining({
        id: 'c',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Husband', 1)]),
      }),
      expect.objectContaining({
        id: 'd',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Dependent', 1)]),
      }),
      expect.objectContaining({
        id: 'e',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Other', 1)]),
      }),
    ]);
  });

  it('skips reciprocal inference when relationshipPairs are empty', async () => {
    mockLoadContactPreferences.mockResolvedValue({ relationshipPairs: [] });
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      relationshipContacts: [{ contactId: 'b', relationship: 'Father' }],
    });
    mockFindContactsByIds.mockResolvedValue([
      contact({ id: 'b', name: 'Bilal Khan', firstName: 'Bilal', gender: 'Male' }),
    ]);

    await upsertContact(source);

    expect(mockBulkSaveContacts).not.toHaveBeenCalled();
  });

  it('writes reciprocal links from legacy relationships[] as well as relationshipContacts', async () => {
    const source = contact({
      id: 'a',
      name: 'Aisha Khan',
      firstName: 'Aisha',
      gender: 'Female',
      relationships: [{ contactId: 'b', relationship: 'Father' }],
    });
    mockFindContactsByIds.mockResolvedValue([
      contact({ id: 'b', name: 'Bilal Khan', firstName: 'Bilal', gender: 'Male' }),
    ]);

    await upsertContact(source);

    expect(mockBulkSaveContacts).toHaveBeenCalledWith('demo', [
      expect.objectContaining({
        id: 'b',
        relationshipContacts: expect.arrayContaining([inferredLink('a', 'Daughter', 1)]),
      }),
    ]);
  });

  it('merges PUT updates onto the existing contact without wiping collections', async () => {
    mockFindContactById.mockResolvedValue(
      contact({
        id: 'a',
        firstName: 'Ahmed',
        phones: [{ label: 'Mobile', number: '3001234567', countryCode: '+92', isPrimary: true }],
        emails: [{ label: 'Home', address: 'ahmed@example.com' }],
        notes: 'Keep me',
      }),
    );

    await updateContactById('a', {
      id: 'a',
      firstName: 'Ali',
      name: 'Ali',
      lastName: '',
      relationshipContacts: [],
      relationships: [],
    } as Contact);

    expect(mockSaveContact).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({
        id: 'a',
        firstName: 'Ali',
        phones: [expect.objectContaining({ countryCode: '+92', number: '3001234567' })],
        emails: [{ label: 'Home', address: 'ahmed@example.com' }],
        notes: 'Keep Me',
      }),
    );
  });

  it('persists an explicit empty phones array and clears the legacy phone scalar', async () => {
    mockFindContactById.mockResolvedValue(
      contact({
        id: 'a',
        firstName: 'Ahmed',
        phone: '+923001234567',
        phones: [{ label: 'Mobile', number: '3001234567', countryCode: '+92', isPrimary: true }],
      }),
    );

    await updateContactById('a', {
      id: 'a',
      firstName: 'Ahmed',
      name: 'Ahmed',
      lastName: '',
      phones: [],
      phone: '',
      relationshipContacts: [],
      relationships: [],
    } as Contact);

    expect(mockSaveContact).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({
        id: 'a',
        phones: [],
        phone: '',
      }),
    );
  });

  it('persists empty emails/addresses/socials and clears legacy scalars + relationships', async () => {
    mockFindContactById.mockResolvedValue(
      contact({
        id: 'a',
        firstName: 'Ahmed',
        email: 'old@example.com',
        emails: [{ label: 'Home', address: 'old@example.com', isPrimary: true }],
        line1: '1 Main',
        city: 'Lahore',
        address: '1 Main',
        addresses: [{ label: 'Home', line1: '1 Main', city: 'Lahore', isPrimary: true }],
        socials: [{ platform: 'Instagram', url: 'https://instagram.com/a' }],
        relationshipContacts: [{ relationship: 'Father', contactId: 'b' }],
        relationships: [{ contactId: 'b', relationship: 'father' }],
      }),
    );

    await updateContactById('a', {
      id: 'a',
      firstName: 'Ahmed',
      name: 'Ahmed',
      lastName: '',
      emails: [],
      addresses: [],
      socials: [],
      relationshipContacts: [],
      relationships: [],
    } as Contact);

    expect(mockSaveContact).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({
        id: 'a',
        emails: [],
        email: '',
        addresses: [],
        line1: '',
        city: '',
        address: '',
        socials: [],
        relationshipContacts: [],
        relationships: [],
      }),
    );
  });

  it('strips client soft-delete fields from prepare/upsert payloads', async () => {
    mockFindContactById.mockResolvedValue(null);

    await upsertContact(
      contact({
        id: 'a',
        firstName: 'Ahmed',
        deletedAt: '2026-01-01T00:00:00.000Z',
        deletedBy: 'attacker',
        deletionReason: 'forged',
      }),
    );

    expect(mockSaveContact).toHaveBeenCalledWith(
      'demo',
      expect.not.objectContaining({
        deletedAt: '2026-01-01T00:00:00.000Z',
        deletedBy: 'attacker',
        deletionReason: 'forged',
      }),
    );
  });

  it('soft-delete bulkSave includes deletedBy and deletionReason for column sync', async () => {
    mockFindContactsByIds.mockResolvedValue([contact({ id: 'a', firstName: 'Ahmed' })]);

    const result = await bulkSoftDeleteContacts(['a'], 'u-admin', 'Duplicate entry');

    expect(result).toEqual({ succeeded: 1, failed: 0 });
    expect(mockBulkSaveContacts).toHaveBeenCalledWith(
      'demo',
      [
        expect.objectContaining({
          id: 'a',
          deletedBy: 'u-admin',
          deletionReason: 'Duplicate entry',
          deletedAt: expect.any(String),
        }),
      ],
    );
  });
});
