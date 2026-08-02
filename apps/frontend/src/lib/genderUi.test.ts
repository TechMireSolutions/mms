import { describe, expect, it } from 'vitest';
import { getGenderIcon, getGenderIconClass, normalizeGenderKey } from './genderUi';
import { Mars, Venus, UserRound } from 'lucide-react';

describe('normalizeGenderKey', () => {
  it('maps male/female variants', () => {
    expect(normalizeGenderKey('Male')).toBe('male');
    expect(normalizeGenderKey('FEMALE')).toBe('female');
    expect(normalizeGenderKey('m')).toBe('male');
    expect(normalizeGenderKey('f')).toBe('female');
  });

  it('maps other/unspecified and empty', () => {
    expect(normalizeGenderKey('other')).toBe('other');
    expect(normalizeGenderKey('unspecified')).toBe('unspecified');
    expect(normalizeGenderKey('')).toBe('');
    expect(normalizeGenderKey(null)).toBe('');
    expect(normalizeGenderKey('custom-value')).toBe('other');
  });
});

describe('getGenderIcon', () => {
  it('returns distinct Lucide icons for male and female', () => {
    expect(getGenderIcon('male')).toBe(Mars);
    expect(getGenderIcon('female')).toBe(Venus);
    expect(getGenderIcon('male')).not.toBe(getGenderIcon('female'));
    expect(getGenderIcon('')).toBe(UserRound);
    expect(getGenderIcon('other')).toBe(UserRound);
  });
});

describe('getGenderIconClass', () => {
  it('uses distinct semantic tones for male and female', () => {
    expect(getGenderIconClass('male')).toBe('text-info');
    expect(getGenderIconClass('female')).toBe('text-secondary');
    expect(getGenderIconClass('male')).not.toBe(getGenderIconClass('female'));
  });
});
