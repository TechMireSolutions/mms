import { describe, expect, it } from 'vitest';
import { findContactDuplicatePairs } from '../contactDuplicateUtils.js';
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
});
