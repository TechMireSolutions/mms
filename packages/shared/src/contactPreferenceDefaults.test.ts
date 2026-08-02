import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELATIONSHIP_PAIRS,
  deriveRelationshipOptionsFromPairs,
  mergeRelationshipOptionLabels,
  normalizeContactPreferences,
} from './contactPreferenceDefaults.js';

describe('deriveRelationshipOptionsFromPairs', () => {
  it('returns unique forward and inverse labels', () => {
    expect(
      deriveRelationshipOptionsFromPairs([
        { id: 'mentor', forward: 'Mentor', inverse: 'Mentee' },
        { id: 'spouse', forward: 'Spouse', inverse: 'Spouse' },
      ]),
    ).toEqual(['Mentor', 'Mentee', 'Spouse']);
  });

  it('includes gendered inverse labels and skips blanks', () => {
    expect(
      deriveRelationshipOptionsFromPairs([
        {
          id: 'parent',
          forward: 'Parent',
          inverse: 'Child',
          inverseMale: 'Son',
          inverseFemale: 'Daughter',
        },
        { id: 'empty', forward: '  ', inverse: '' },
      ]),
    ).toEqual(['Parent', 'Child', 'Son', 'Daughter']);
  });

  it('dedupes case-insensitively while preserving first casing', () => {
    expect(
      deriveRelationshipOptionsFromPairs([
        { id: 'a', forward: 'Guardian', inverse: 'Dependent' },
        { id: 'b', forward: 'guardian', inverse: 'DEPENDENT' },
      ]),
    ).toEqual(['Guardian', 'Dependent']);
  });
});

describe('mergeRelationshipOptionLabels', () => {
  it('keeps pair labels ahead of existing ad-hoc options', () => {
    expect(mergeRelationshipOptionLabels(['Mentor', 'Mentee'], ['Father', 'mentor'])).toEqual([
      'Mentor',
      'Mentee',
      'Father',
    ]);
  });
});

describe('normalizeContactPreferences', () => {
  it('restores default relationship pairs when stored list is empty', () => {
    const normalized = normalizeContactPreferences({
      defaultCity: 'Karachi',
      relationshipPairs: [],
    });
    expect(normalized.defaultCity).toBe('Karachi');
    expect(normalized.relationshipPairs).toEqual(DEFAULT_RELATIONSHIP_PAIRS);
  });
});
