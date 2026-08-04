import { describe, expect, it } from 'vitest';
import {
  deriveStudentGuardiansFromContact,
  resolveStudentGuardianLinks,
} from '../studentGuardianFromContacts.js';

describe('studentGuardianFromContacts', () => {
  it('derives father/mother/guardian from relationshipContacts labels', () => {
    const derived = deriveStudentGuardiansFromContact({
      relationshipContacts: [
        { contactId: 'c-f', relationship: 'Father', name: 'Abu' },
        { contactId: 'c-m', relationship: 'Mother', name: 'Umm' },
        { contactId: 'c-g', relationship: 'Guardian', name: 'Uncle' },
        { contactId: 'c-x', relationship: 'Sibling', name: 'Skip' },
      ],
    });
    expect(derived).toEqual({
      fatherContactId: 'c-f',
      fatherName: 'Abu',
      motherContactId: 'c-m',
      motherName: 'Umm',
      guardianContactId: 'c-g',
      guardianName: 'Uncle',
    });
  });

  it('prefers contact relationships over legacy student guardian fields', () => {
    const resolved = resolveStudentGuardianLinks(
      {
        fatherContactId: 'legacy-f',
        fatherName: 'Legacy Father',
        motherContactId: 'legacy-m',
      },
      {
        relationshipContacts: [{ contactId: 'rel-f', relationship: 'father', name: 'Rel Father' }],
      },
    );
    expect(resolved.fatherContactId).toBe('rel-f');
    expect(resolved.fatherName).toBe('Rel Father');
    expect(resolved.motherContactId).toBe('legacy-m');
  });

  it('falls back to legacy student fields when contact has no matching roles', () => {
    const resolved = resolveStudentGuardianLinks(
      {
        guardianContactId: 'legacy-g',
        guardianName: 'Legacy Guardian',
      },
      { relationshipContacts: [] },
    );
    expect(resolved.guardianContactId).toBe('legacy-g');
    expect(resolved.guardianName).toBe('Legacy Guardian');
  });
});
