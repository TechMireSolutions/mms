import { describe, expect, it } from 'vitest';
import type { Contact } from './contactEntityTypes.js';
import {
  isAllowedRelationshipLabel,
  normalizeRelationshipTerm,
  resolveInverseRelationship,
} from './contactRelationshipRules.js';

function contact(partial: Partial<Contact> & { id: string }): Contact {
  return {
    firstName: 'Test',
    lastName: 'User',
    ...partial,
  } as Contact;
}

describe('normalizeRelationshipTerm', () => {
  it('lowercases, trims, and normalizes in-law spacing', () => {
    expect(normalizeRelationshipTerm('  Father-In-Law  ')).toBe('father-in-law');
    expect(normalizeRelationshipTerm('Brother in Law')).toBe('brother-in-law');
    expect(normalizeRelationshipTerm('Aunt_Uncle')).toBe('aunt-uncle');
  });

  it('returns empty for non-strings', () => {
    expect(normalizeRelationshipTerm(null)).toBe('');
    expect(normalizeRelationshipTerm(12)).toBe('');
  });
});

describe('resolveInverseRelationship', () => {
  it('returns null for labels without configured pairs', () => {
    expect(
      resolveInverseRelationship('Father', contact({ id: '1', gender: 'female' })),
    ).toBeNull();
    expect(
      resolveInverseRelationship('Father', contact({ id: '1', gender: 'female' }), []),
    ).toBeNull();
  });

  it('uses custom pair inverse when configured', () => {
    expect(
      resolveInverseRelationship('Mentor', contact({ id: '1', gender: 'male' }), [
        { id: 'pair_1', forward: 'Mentor', inverse: 'Mentee' },
      ]),
    ).toBe('Mentee');
  });

  it('returns exact pair.forward for inverse side (no gender rewrite)', () => {
    expect(
      resolveInverseRelationship('Son', contact({ id: '1', gender: 'female' }), [
        {
          id: 'pair_1',
          forward: 'Father',
          inverse: 'Child',
          inverseMale: 'Son',
          inverseFemale: 'Daughter',
        },
      ]),
    ).toBe('Father');
  });

  it('returns gendered inverse when matching forward', () => {
    const pair = {
      id: 'pair_1',
      forward: 'Father',
      inverse: 'Child',
      inverseMale: 'Son',
      inverseFemale: 'Daughter',
    };
    expect(
      resolveInverseRelationship('Father', contact({ id: '1', gender: 'female' }), [pair]),
    ).toBe('Daughter');
    expect(
      resolveInverseRelationship('Father', contact({ id: '2', gender: 'male' }), [pair]),
    ).toBe('Son');
  });
});

describe('isAllowedRelationshipLabel', () => {
  const pairs = [
    {
      id: 'pair_1',
      forward: 'Father',
      inverse: 'Child',
      inverseMale: 'Son',
      inverseFemale: 'Daughter',
    },
  ];

  it('allows only pair-derived labels', () => {
    expect(isAllowedRelationshipLabel('Father', pairs)).toBe(true);
    expect(isAllowedRelationshipLabel('daughter', pairs)).toBe(true);
    expect(isAllowedRelationshipLabel('Mother', pairs)).toBe(false);
    expect(isAllowedRelationshipLabel('Grandfather', pairs)).toBe(false);
    expect(isAllowedRelationshipLabel('Grandfather', [])).toBe(false);
  });
});
