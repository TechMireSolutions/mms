import { describe, expect, it, vi } from 'vitest';
import {
  loadContactChildMaps,
  loadContactSummaryChildMaps,
} from '../db/repositories/contactRepositoryHydrateChildren.js';

function createMockTx(queue: unknown[][]) {
  let index = 0;
  const makeNode = (): any => ({
    from: () => makeNode(),
    where: () => makeNode(),
    orderBy: () => makeNode(),
    then: (resolve: (v: unknown) => void) => resolve(queue[index++] ?? []),
  });

  return {
    select: vi.fn(() => makeNode()),
  } as any;
}

describe('contactRepositoryHydrateChildren', () => {
  it('loadContactChildMaps groups all 12 child collections by contactId', async () => {
    const mockPhones = [
      { id: 'p1', contactId: 'c1', number: '+1234567890', isPrimary: true },
      { id: 'p2', contactId: 'c2', number: '+0987654321', isPrimary: false },
    ];
    const mockEmails = [
      { id: 'e1', contactId: 'c1', address: 'c1@example.com', isPrimary: true },
    ];
    const mockAddresses = [
      { id: 'a1', contactId: 'c1', line1: '123 Main St', city: 'Metropolis' },
    ];
    const mockTags = [{ id: 't1', contactId: 'c1', name: 'VIP' }];
    const mockSocials = [{ id: 's1', contactId: 'c1', platform: 'twitter', handle: '@c1' }];
    const mockEducations = [{ id: 'ed1', contactId: 'c1', institution: 'University' }];
    const mockExperiences = [{ id: 'ex1', contactId: 'c1', company: 'Tech Inc' }];
    const mockSkills = [{ id: 'sk1', contactId: 'c1', name: 'TypeScript' }];
    const mockRelationships = [{ id: 'r1', contactId: 'c1', relatedContactId: 'c2', relationship: 'Parent' }];
    const mockActivities = [{ id: 'act1', contactId: 'c1', type: 'call', content: 'Follow-up' }];
    const mockAttachments = [{ id: 'att1', contactId: 'c1', name: 'doc.pdf', url: 'https://example.com/doc.pdf' }];
    const mockBankDetails = [{ id: 'bd1', contactId: 'c1', bankName: 'Global Bank' }];

    const tx = createMockTx([
      mockPhones,
      mockEmails,
      mockAddresses,
      mockTags,
      mockSocials,
      mockEducations,
      mockExperiences,
      mockSkills,
      mockRelationships,
      mockActivities,
      mockAttachments,
      mockBankDetails,
    ]);

    const result = await loadContactChildMaps(tx, 'test-subdomain', ['c1', 'c2']);

    expect(tx.select).toHaveBeenCalledTimes(12);
    expect(result.phonesMap.get('c1')).toEqual([mockPhones[0]]);
    expect(result.phonesMap.get('c2')).toEqual([mockPhones[1]]);
    expect(result.emailsMap.get('c1')).toEqual([mockEmails[0]]);
    expect(result.addressesMap.get('c1')).toEqual([mockAddresses[0]]);
    expect(result.tagsMap.get('c1')).toEqual([mockTags[0]]);
    expect(result.socialsMap.get('c1')).toEqual([mockSocials[0]]);
    expect(result.educationsMap.get('c1')).toEqual([mockEducations[0]]);
    expect(result.experiencesMap.get('c1')).toEqual([mockExperiences[0]]);
    expect(result.skillsMap.get('c1')).toEqual([mockSkills[0]]);
    expect(result.relationshipsMap.get('c1')).toEqual([mockRelationships[0]]);
    expect(result.activitiesMap.get('c1')).toEqual([mockActivities[0]]);
    expect(result.attachmentsMap.get('c1')).toEqual([mockAttachments[0]]);
    expect(result.bankDetailsMap.get('c1')).toEqual([mockBankDetails[0]]);
  });

  it('loadContactSummaryChildMaps queries only 6 collections and returns empty maps for remaining', async () => {
    const mockPhones = [{ id: 'p1', contactId: 'c1', number: '+1234567890' }];
    const mockEmails = [{ id: 'e1', contactId: 'c1', address: 'c1@test.com' }];
    const mockAddresses = [{ id: 'a1', contactId: 'c1', line1: '456 Side St' }];
    const mockTags = [{ id: 't1', contactId: 'c1', name: 'Staff' }];
    const mockSocials = [{ id: 's1', contactId: 'c1', platform: 'twitter' }];
    const mockRelationships = [{ id: 'r1', contactId: 'c1', relationship: 'Parent' }];

    const tx = createMockTx([
      mockPhones,
      mockEmails,
      mockAddresses,
      mockTags,
      mockSocials,
      mockRelationships,
    ]);

    const result = await loadContactSummaryChildMaps(tx, 'test-subdomain', ['c1']);

    expect(tx.select).toHaveBeenCalledTimes(6);
    expect(result.phonesMap.get('c1')).toEqual([mockPhones[0]]);
    expect(result.emailsMap.get('c1')).toEqual([mockEmails[0]]);
    expect(result.addressesMap.get('c1')).toEqual([mockAddresses[0]]);
    expect(result.tagsMap.get('c1')).toEqual([mockTags[0]]);
    expect(result.socialsMap.get('c1')).toEqual([mockSocials[0]]);
    expect(result.relationshipsMap.get('c1')).toEqual([mockRelationships[0]]);
    expect(result.educationsMap.size).toBe(0);
    expect(result.experiencesMap.size).toBe(0);
    expect(result.skillsMap.size).toBe(0);
    expect(result.activitiesMap.size).toBe(0);
    expect(result.attachmentsMap.size).toBe(0);
    expect(result.bankDetailsMap.size).toBe(0);
  });
});
