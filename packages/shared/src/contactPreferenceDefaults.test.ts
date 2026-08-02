import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELATIONSHIP_PAIRS,
  buildRelationshipPairAddition,
  deriveRelationshipOptionsFromPairs,
  isDuplicateRelationshipPair,
  mergeRelationshipOptionLabels,
  normalizeContactPreferences,
  pruneRelationshipPairsForRemovedLabel,
  resolveRelationshipPairs,
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

describe('resolveRelationshipPairs', () => {
  it('returns defaults for missing or empty lists', () => {
    expect(resolveRelationshipPairs(null)).toEqual(DEFAULT_RELATIONSHIP_PAIRS);
    expect(resolveRelationshipPairs([])).toEqual(DEFAULT_RELATIONSHIP_PAIRS);
  });

  it('returns the provided non-empty list', () => {
    const pairs = [{ id: 'mentor', forward: 'Mentor', inverse: 'Mentee' }];
    expect(resolveRelationshipPairs(pairs)).toEqual(pairs);
  });
});

describe('isDuplicateRelationshipPair', () => {
  const pairs = [{ id: 'mentor', forward: 'Mentor', inverse: 'Mentee' }];

  it('matches order-independently and case-insensitively', () => {
    expect(isDuplicateRelationshipPair(pairs, 'mentor', 'mentee')).toBe(true);
    expect(isDuplicateRelationshipPair(pairs, 'Mentee', 'Mentor')).toBe(true);
    expect(isDuplicateRelationshipPair(pairs, 'Uncle', 'Nephew')).toBe(false);
  });
});

describe('buildRelationshipPairAddition', () => {
  it('rejects empty or duplicate pairs', () => {
    expect(
      buildRelationshipPairAddition([{ id: 'a', forward: 'Mentor', inverse: 'Mentee' }], [], '  ', 'Mentee'),
    ).toEqual({ ok: false, reason: 'empty' });
    expect(
      buildRelationshipPairAddition(
        [{ id: 'a', forward: 'Mentor', inverse: 'Mentee' }],
        ['Mentor'],
        'Mentee',
        'Mentor',
      ),
    ).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('appends the pair and merges both labels', () => {
    const result = buildRelationshipPairAddition(
      [{ id: 'a', forward: 'Father', inverse: 'Child' }],
      ['Father', 'Child'],
      'Mentor',
      'Mentee',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selected).toBe('Mentor');
    expect(result.labels).toEqual(['Father', 'Child', 'Mentor', 'Mentee']);
    expect(result.pairs).toHaveLength(2);
    expect(result.pairs[1]).toMatchObject({ forward: 'Mentor', inverse: 'Mentee' });
    expect(result.pairs[1]?.id).toMatch(/^pair_/);
  });

  it('allows self-inverse pairs', () => {
    const result = buildRelationshipPairAddition([], [], 'Spouse', 'Spouse');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.labels).toEqual(['Spouse']);
    expect(result.pairs[0]).toMatchObject({ forward: 'Spouse', inverse: 'Spouse' });
  });
});

describe('pruneRelationshipPairsForRemovedLabel', () => {
  it('drops pairs that reference the removed label on either side', () => {
    expect(
      pruneRelationshipPairsForRemovedLabel(
        [
          { id: 'a', forward: 'Mentor', inverse: 'Mentee' },
          { id: 'b', forward: 'Father', inverse: 'Child' },
        ],
        'mentee',
      ),
    ).toEqual([{ id: 'b', forward: 'Father', inverse: 'Child' }]);
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
