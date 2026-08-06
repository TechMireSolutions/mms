import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RELATIONSHIP_PAIRS,
  LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS,
  applyRelationshipOptionOrder,
  applyRelationshipOptionsUpdate,
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

  it('parses gendered inverse sides as neutral | male | female', () => {
    expect(parseRelationshipPairInput('Parent : Child | Son | Daughter')).toEqual({
      ok: true,
      forward: 'Parent',
      inverse: 'Child',
      inverseMale: 'Son',
      inverseFemale: 'Daughter',
    });
  });

  it('rejects empty input, empty sides, or malformed gendered forms', () => {
    expect(parseRelationshipPairInput('  ')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRelationshipPairInput('Husband :')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRelationshipPairInput(': Wife')).toEqual({ ok: false, reason: 'empty' });
    expect(parseRelationshipPairInput('Parent : Son | Daughter')).toEqual({
      ok: false,
      reason: 'malformed',
    });
    expect(parseRelationshipPairInput('Parent : Child | Son | Daughter | Extra')).toEqual({
      ok: false,
      reason: 'malformed',
    });
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
    expect(isDuplicateRelationshipPair(pairs, { forward: 'mentor', inverse: 'mentee' })).toBe(true);
    expect(isDuplicateRelationshipPair(pairs, { forward: 'Mentee', inverse: 'Mentor' })).toBe(true);
    expect(isDuplicateRelationshipPair(pairs, { forward: 'Uncle', inverse: 'Nephew' })).toBe(false);
  });

  it('treats overlapping labels including gendered inverses as duplicates', () => {
    const gendered = [
      {
        id: 'parent',
        forward: 'Parent',
        inverse: 'Child',
        inverseMale: 'Son',
        inverseFemale: 'Daughter',
      },
    ];
    expect(isDuplicateRelationshipPair(gendered, { forward: 'Guardian', inverse: 'Son' })).toBe(true);
    expect(
      isDuplicateRelationshipPair(gendered, {
        forward: 'Uncle',
        inverse: 'Nephew',
        inverseMale: 'Son',
        inverseFemale: 'Niece',
      }),
    ).toBe(true);
    expect(isDuplicateRelationshipPair(gendered, { forward: 'Uncle', inverse: 'Nephew' })).toBe(false);
  });
});

describe('buildRelationshipPairAddition', () => {
  it('rejects empty or duplicate pairs', () => {
    expect(
      buildRelationshipPairAddition(
        [{ id: 'a', forward: 'Mentor', inverse: 'Mentee' }],
        [],
        { forward: '  ', inverse: 'Mentee' },
      ),
    ).toEqual({ ok: false, reason: 'empty' });
    expect(
      buildRelationshipPairAddition(
        [{ id: 'a', forward: 'Mentor', inverse: 'Mentee' }],
        ['Mentor'],
        { forward: 'Mentee', inverse: 'Mentor' },
      ),
    ).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('appends the pair and merges both labels', () => {
    const result = buildRelationshipPairAddition(
      [{ id: 'a', forward: 'Father', inverse: 'Child' }],
      ['Father', 'Child'],
      { forward: 'Mentor', inverse: 'Mentee' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selected).toBe('Mentor');
    expect(result.labels).toEqual(['Father', 'Child', 'Mentor', 'Mentee']);
    expect(result.pairs).toHaveLength(2);
    expect(result.pairs[1]).toMatchObject({ forward: 'Mentor', inverse: 'Mentee' });
    expect(result.pairs[1]?.id).toMatch(/^pair_/);
  });

  it('stores gendered inverses and merges their labels', () => {
    const result = buildRelationshipPairAddition([], [], {
      forward: 'Parent',
      inverse: 'Child',
      inverseMale: 'Son',
      inverseFemale: 'Daughter',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pairs[0]).toMatchObject({
      forward: 'Parent',
      inverse: 'Child',
      inverseMale: 'Son',
      inverseFemale: 'Daughter',
    });
    expect(result.labels).toEqual(['Parent', 'Child', 'Son', 'Daughter']);
  });

  it('allows self-inverse pairs', () => {
    const result = buildRelationshipPairAddition([], [], { forward: 'Spouse', inverse: 'Spouse' });
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

describe('applyRelationshipOptionOrder', () => {
  it('reorders labels to preferred order and drops stale preferred entries', () => {
    expect(
      applyRelationshipOptionOrder(
        ['Father', 'Child', 'Son', 'Daughter'],
        ['Daughter', 'Father', 'Unknown', 'Child'],
      ),
    ).toEqual(['Daughter', 'Father', 'Child', 'Son']);
  });
});

describe('applyRelationshipOptionsUpdate', () => {
  it('prunes removed labels and stores preferred order', () => {
    const result = applyRelationshipOptionsUpdate(
      [
        { id: 'a', forward: 'Father', inverse: 'Child', inverseMale: 'Son', inverseFemale: 'Daughter' },
        { id: 'b', forward: 'Mentor', inverse: 'Mentee' },
      ],
      ['Father', 'Child', 'Son', 'Daughter', 'Mentor', 'Mentee'],
      ['Daughter', 'Father', 'Child', 'Son'],
    );
    expect(result.pairs).toEqual([
      { id: 'a', forward: 'Father', inverse: 'Child', inverseMale: 'Son', inverseFemale: 'Daughter' },
    ]);
    expect(result.labels).toEqual(['Daughter', 'Father', 'Child', 'Son']);
    expect(result.optionOrder).toEqual(['Daughter', 'Father', 'Child', 'Son']);
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
    expect(normalized.relationshipOptionOrder).toEqual([]);
  });

  it('sanitizes relationshipOptionOrder to pair-derived labels', () => {
    const normalized = normalizeContactPreferences({
      relationshipPairs: [
        { id: 'a', forward: 'Father', inverse: 'Child', inverseMale: 'Son', inverseFemale: 'Daughter' },
      ],
      relationshipOptionOrder: ['Daughter', 'Stale', 'Father'],
    });
    expect(normalized.relationshipOptionOrder).toEqual(['Daughter', 'Father', 'Child', 'Son']);
  });
});
