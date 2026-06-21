import { describe, expect, it } from 'vitest';
import { filterActiveContacts, isContactDeleted } from '../contactSoftDelete.js';
import type { Contact } from '../contactTypes.js';

const active: Contact = {
  id: '1',
  firstName: 'Ali',
  name: 'Ali',
};

const deleted: Contact = {
  id: '2',
  firstName: 'Sara',
  name: 'Sara',
  deletedAt: '2026-01-01T00:00:00.000Z',
};

describe('contactSoftDelete', () => {
  it('isContactDeleted detects deletedAt', () => {
    expect(isContactDeleted(active)).toBe(false);
    expect(isContactDeleted(deleted)).toBe(true);
  });

  it('filterActiveContacts excludes soft-deleted rows', () => {
    expect(filterActiveContacts([active, deleted])).toEqual([active]);
  });
});
