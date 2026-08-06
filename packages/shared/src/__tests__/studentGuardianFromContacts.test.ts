import { describe, expect, it } from 'vitest';
import {
  deriveStudentGuardiansFromContact,
  hasResponsibleAdultLink,
  listStudentContactRelationships,
  pickPrimaryResponsibleAdult,
  resolveStudentGuardianLinks,
} from '../studentGuardianFromContacts.js';

describe('studentGuardianFromContacts', () => {
  it('lists only system-catalog relationship labels', () => {
    const links = listStudentContactRelationships({
      relationshipContacts: [
        { contactId: 'c-p', relationship: 'Parent', name: 'Abu' },
        { contactId: 'c-g', relationship: 'Guardian', name: 'Uncle' },
        { contactId: 'c-w', relationship: 'Wife', name: 'Spouse' },
        { contactId: 'c-x', relationship: 'Father', name: 'Skip' },
        { contactId: 'c-s', relationship: 'Sibling', name: 'Skip' },
      ],
    });
    expect(links).toEqual([
      { contactId: 'c-p', name: 'Abu', relationship: 'Parent' },
      { contactId: 'c-g', name: 'Uncle', relationship: 'Guardian' },
      { contactId: 'c-w', name: 'Spouse', relationship: 'Wife' },
    ]);
  });

  it('maps Parent/Guardian into display slots and ignores Mother/Father labels', () => {
    const derived = deriveStudentGuardiansFromContact({
      relationshipContacts: [
        { contactId: 'c-p', relationship: 'Parent', name: 'Abu' },
        { contactId: 'c-g', relationship: 'Guardian', name: 'Uncle' },
        { contactId: 'c-f', relationship: 'Father', name: 'Old' },
      ],
    });
    expect(derived).toEqual({
      fatherContactId: 'c-p',
      fatherName: 'Abu',
      motherContactId: undefined,
      motherName: undefined,
      guardianContactId: 'c-g',
      guardianName: 'Uncle',
    });
  });

  it('prefers contact Parent/Guardian over legacy student fields', () => {
    const resolved = resolveStudentGuardianLinks(
      {
        fatherContactId: 'legacy-f',
        fatherName: 'Legacy Father',
        guardianContactId: 'legacy-g',
      },
      {
        relationshipContacts: [{ contactId: 'rel-p', relationship: 'Parent', name: 'Rel Parent' }],
      },
    );
    expect(resolved.fatherContactId).toBe('rel-p');
    expect(resolved.fatherName).toBe('Rel Parent');
    expect(resolved.guardianContactId).toBe('legacy-g');
  });

  it('falls back to legacy student fields when contact has no Parent/Guardian', () => {
    const resolved = resolveStudentGuardianLinks(
      {
        guardianContactId: 'legacy-g',
        guardianName: 'Legacy Guardian',
      },
      { relationshipContacts: [{ contactId: 'c-w', relationship: 'Wife', name: 'Spouse' }] },
    );
    expect(resolved.guardianContactId).toBe('legacy-g');
    expect(resolved.guardianName).toBe('Legacy Guardian');
    expect(resolved.fatherContactId).toBeUndefined();
  });

  it('detects responsible adult links and picks Parent over Guardian', () => {
    const contact = {
      relationshipContacts: [
        { contactId: 'c-g', relationship: 'Guardian', name: 'Uncle' },
        { contactId: 'c-p', relationship: 'Parent', name: 'Abu' },
      ],
    };
    const links = listStudentContactRelationships(contact);
    expect(hasResponsibleAdultLink(contact)).toBe(true);
    expect(pickPrimaryResponsibleAdult(links)?.contactId).toBe('c-p');
    expect(hasResponsibleAdultLink({ relationshipContacts: [{ contactId: 'c-w', relationship: 'Wife' }] })).toBe(false);
  });
});