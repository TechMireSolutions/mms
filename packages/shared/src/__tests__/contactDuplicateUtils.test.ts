import { describe, expect, it } from 'vitest';
import {
  findContactDuplicatePairs,
  getContactDuplicateCandidateKeys,
} from '../contactDuplicateUtils.js';
import { buildNamePrefixRegex } from '../contactDisplayUtils.js';
import type { Contact } from '../contactTypes.js';

function contact(id: string, name: string, phone?: string, email?: string): Contact {
  return {
    id,
    name,
    firstName: name,
    phones: phone ? [{ label: 'mobile', number: phone }] : [],
    emails: email ? [{ label: 'personal', address: email }] : [],
  };
}

describe('buildNamePrefixRegex', () => {
  it('builds an anchored alternation from normalized prefixes', () => {
    expect(buildNamePrefixRegex(['syed', 'syeda'])).toBe('^(syed|syeda)\\s+');
  });

  it('normalizes case and trims each prefix', () => {
    expect(buildNamePrefixRegex([' Syed ', 'SYEDA'])).toBe('^(syed|syeda)\\s+');
  });

  it('dedupes repeated prefixes', () => {
    expect(buildNamePrefixRegex(['syed', 'syed'])).toBe('^(syed)\\s+');
  });

  it('escapes regex metacharacters', () => {
    expect(buildNamePrefixRegex(['a.b'])).toBe('^(a\\.b)\\s+');
  });

  it('returns an empty pattern when nothing to ignore', () => {
    expect(buildNamePrefixRegex([])).toBe('');
    expect(buildNamePrefixRegex(['  '])).toBe('');
  });
});

describe('getContactDuplicateCandidateKeys', () => {
  it('returns normalized phones, emails, and prefix-stripped name', () => {
    const keys = getContactDuplicateCandidateKeys(
      contact('1', 'Syed Ahmed', '+92 300-1234567', 'Ali@Example.COM'),
      { namePrefixesToIgnore: ['syed'] },
    );
    expect(keys).toEqual({
      phones: ['3001234567'],
      emails: ['ali@example.com'],
      name: 'ahmed',
      cnic: '',
    });
  });

  it('collapses internal whitespace in name keys', () => {
    const keys = getContactDuplicateCandidateKeys(contact('1', 'Ali  Khan'), {});
    expect(keys.name).toBe('alikhan');
  });

  it('matches pair-finder results for prefix-stripped names', () => {
    const prefixed = contact('1', 'Syed Ahmed', '+923001111111');
    const plain = contact('2', 'Ahmed', '+923001111111');
    const prefs = { namePrefixesToIgnore: ['syed', 'syeda'] };

    const keysPrefixed = getContactDuplicateCandidateKeys(prefixed, prefs);
    const keysPlain = getContactDuplicateCandidateKeys(plain, prefs);
    expect(keysPrefixed.name).toBe(keysPlain.name);

    const pairs = findContactDuplicatePairs([prefixed, plain], prefs);
    expect(pairs.some((p) => p.reasonKey === 'namePhone')).toBe(true);
  });
});

describe('findContactDuplicatePairs (indexed)', () => {
  it('finds phone matches', () => {
    const pairs = findContactDuplicatePairs([
      contact('1', 'Ali', '+923001111111'),
      contact('2', 'Ali Khan', '+923001111111'),
      contact('3', 'Sara', '+923002222222'),
    ]);
    expect(pairs.some((p) => p.reasonKey === 'namePhone' || p.reasonKey === 'phone')).toBe(true);
  });

  it('finds email-only matches', () => {
    const pairs = findContactDuplicatePairs([
      contact('1', 'A', undefined, 'a@test.com'),
      contact('2', 'B', undefined, 'a@test.com'),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.reasonKey).toBe('email');
  });

  it('finds CNIC matches with high confidence', () => {
    const c1: Contact = { ...contact('1', 'Ali Khan'), cnic: '42101-1234567-1' };
    const c2: Contact = { ...contact('2', 'Muhammad Ali'), cnic: '4210112345671' };
    const pairs = findContactDuplicatePairs([c1, c2]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.reasonKey).toBe('cnic');
    expect(pairs[0]?.confidence).toBe(99);
  });

  it('finds CNIC + Name matches with 100% confidence', () => {
    const c1: Contact = { ...contact('1', 'Ali Khan'), cnic: '42101-1234567-1' };
    const c2: Contact = { ...contact('2', 'Ali Khan'), cnic: '4210112345671' };
    const pairs = findContactDuplicatePairs([c1, c2]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.reasonKey).toBe('cnicName');
    expect(pairs[0]?.confidence).toBe(100);
  });
});

