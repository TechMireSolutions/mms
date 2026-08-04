import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELATIONSHIP_PAIRS,
  LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS,
  buildRelationshipPairAddition,
  deriveRelationshipOptionsFromPairs,
  isDuplicateRelationshipPair,
  mergeRelationshipOptionLabels,
  normalizeContactPreferences,
  parseRelationshipPairInput,
  pruneRelationshipPairsForRemovedLabel,
  resolveRelationshipPairs,
} from './contactPreferenceDefaults.js';

describe('parseRelationshipPairInput', () => {
  it('splits on colon, slash, or arrow with surrounding spaces', () => {
    expect(parseRelationshipPairInput('Husband : Wife')).toEqual({
      ok: true,
      forward: 'Husband',
      inverse: 'Wife',
    });
    expect(parseRelationshipPairInput('Son/Daughter')).toEqual({
      ok: true,
      forward: 'Son',
      inverse: 'Daughter',
    });
    expect(parseRelationshipPairInput('Mentor ↔ Mentee')).toEqual({
      ok: true,
      forward: 'Mentor',
      inverse: 'Mentee',
    });
  });

  it('treats a single label as self-inverse', () => {
    expect(parseRelationshipPairInput('Spouse')).toEqual({
      ok: true,
      forward: 'Spouse',
      inverse: 'Spouse',
    });
  });

  it('rejects empty input or empty sides', () => {
    expect(parseRelationshipPairInput('  ')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRelationshipPairInput('Husband :')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRelationshipPairInput(': Wife')).toEqual({ ok: false, reason: 'empty' });
  });
});

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
  it('returns empty for missing or empty lists', () => {
    expect(resolveRelationshipPairs(null)).toEqual([]);
    expect(resolveRelationshipPairs([])).toEqual([]);
    expect(DEFAULT_RELATIONSHIP_PAIRS).toEqual([]);
  });

  it('returns the provided non-empty list without legacy ids', () => {
    const pairs = [{ id: 'mentor', forward: 'Mentor', inverse: 'Mentee' }];
    expect(resolveRelationshipPairs(pairs)).toEqual(pairs);
  });

  it('strips legacy built-in seed pair ids', () => {
    const custom = { id: 'pair_abc', forward: 'Mentor', inverse: 'Mentee' };
    const legacyId = [...LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS][0]!;
    expect(
      resolveRelationshipPairs([
        { id: legacyId, forward: 'Father', inverse: 'Child' },
        custom,
      ]),
    ).toEqual([custom]);
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
  it('keeps empty relationship pairs (no built-in restore)', () => {
    const normalized = normalizeContactPreferences({
      defaultCity: 'Karachi',
      relationshipPairs: [],
    });
    expect(normalized.defaultCity).toBe('Karachi');
    expect(normalized.relationshipPairs).toEqual([]);
  });
});
