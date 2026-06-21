import { describe, expect, it } from 'vitest';
import type { Contact } from '../contactTypes.js';
import { diffContactForSync, mergeContactForSync, resolveSyncConflictContactId } from '../contactSyncDiff.js';

const base: Contact = {
  id: '1',
  name: 'Ali Khan',
  firstName: 'Ali',
  lastName: 'Khan',
  gender: 'male',
  lifecycleStage: 'lead',
  phone: '+923001234567',
  email: 'ali@example.com',
  city: 'Lahore',
  phones: [{ number: '+923001234567', label: 'mobile' }],
  emails: [{ address: 'ali@example.com', label: 'personal' }],
  addresses: [{ city: 'Lahore', label: 'home' }],
};

describe('diffContactForSync', () => {
  it('returns diffs when server differs', () => {
    const server = { ...base, lifecycleStage: 'student' };
    const diffs = diffContactForSync(base, server);
    expect(diffs.some((d) => d.field === 'lifecycleStage')).toBe(true);
    expect(diffs.find((d) => d.field === 'lifecycleStage')?.server).toBe('student');
  });

  it('returns empty when server matches', () => {
    expect(diffContactForSync(base, { ...base })).toEqual([]);
  });

  it('handles missing server contact', () => {
    const diffs = diffContactForSync(base, undefined);
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs[0]?.server).toBe('—');
  });
});

describe('resolveSyncConflictContactId', () => {
  it('resolves update contact id', () => {
    expect(
      resolveSyncConflictContactId({ kind: 'update', contactId: '42', contact: base }),
    ).toBe('42');
  });

  it('resolves upsert from contact', () => {
    expect(resolveSyncConflictContactId({ kind: 'upsert', contact: base })).toBe('1');
  });
});

describe('mergeContactForSync', () => {
  it('merges picked fields from local and server', () => {
    const server = { ...base, lifecycleStage: 'student', gender: 'female' };
    const merged = mergeContactForSync(base, server, { lifecycleStage: 'local', gender: 'server' });
    expect(merged.lifecycleStage).toBe('lead');
    expect(merged.gender).toBe('female');
  });
});
