import { describe, expect, it } from 'vitest';
import type { Contact } from './contactEntityTypes.js';
import {
  composeRelationship,
  inverseRole,
  normalizeRelationshipTerm,
  relationshipLabel,
  relationshipRole,
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

describe('relationshipRole / inverseRole', () => {
  it('maps known terms and defaults to other', () => {
    expect(relationshipRole('Mother')).toBe('parent');
    expect(relationshipRole('son-in-law')).toBe('child_in_law');
    expect(relationshipRole('mentor')).toBe('other');
  });

  it('inverts asymmetric roles and keeps symmetric roles', () => {
    expect(inverseRole('parent')).toBe('child');
    expect(inverseRole('aunt_uncle')).toBe('niece_nephew');
    expect(inverseRole('spouse')).toBe('spouse');
    expect(inverseRole('sibling')).toBe('sibling');
  });
});

describe('composeRelationship', () => {
  it('resolves high-confidence inference paths', () => {
    expect(composeRelationship('parent', 'parent')).toBe('grandparent');
    expect(composeRelationship('sibling', 'spouse')).toBe('sibling_in_law');
    expect(composeRelationship('cousin', 'parent')).toBeNull();
  });
});

describe('relationshipLabel / resolveInverseRelationship', () => {
  it('genders labels from contact gender', () => {
    expect(relationshipLabel('parent', contact({ id: '1', gender: 'female' }))).toBe('Mother');
    expect(relationshipLabel('child', contact({ id: '2', gender: 'male' }))).toBe('Son');
  });

  it('resolves built-in inverse labels', () => {
    expect(
      resolveInverseRelationship('Father', contact({ id: '1', gender: 'female' })),
    ).toBe('Daughter');
  });

  it('uses custom pair inverse when configured', () => {
    expect(
      resolveInverseRelationship('Mentor', contact({ id: '1', gender: 'male' }), [
        { id: 'pair_1', forward: 'Mentor', inverse: 'Mentee' },
      ]),
    ).toBe('Mentee');
  });
});
