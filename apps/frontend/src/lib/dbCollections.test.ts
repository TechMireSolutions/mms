import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { hasCollectionInCache, getCollection } from '@/lib/dbCollections';
import { scopedStorageKey } from '@/lib/dbStorageCore';

// Avoid real network calls from getCollection's background sync during seeding.
vi.mock('@/lib/dbStorageCore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dbStorageCore')>();
  return {
    ...actual,
    syncToServer: vi.fn().mockResolvedValue({ ok: true }),
  };
});

describe('dbCollections', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('hasCollectionInCache returns false when nothing is stored', () => {
    expect(hasCollectionInCache('currencies')).toBe(false);
  });

  it('hasCollectionInCache returns true when the scoped key exists', () => {
    localStorage.setItem(scopedStorageKey('currencies'), '[]');
    expect(hasCollectionInCache('currencies')).toBe(true);
  });

  it('getCollection returns default data when nothing is cached', () => {
    const defaults = [{ id: 'cur1', code: 'PKR' }];
    const result = getCollection('currencies', defaults);
    expect(result).toEqual(defaults);
  });

  it('getCollection returns cached array data', () => {
    const cached = [{ id: 'cur1', code: 'USD' }];
    localStorage.setItem(scopedStorageKey('currencies'), JSON.stringify(cached));
    const result = getCollection('currencies', []);
    expect(result).toEqual(cached);
  });

  it('getCollection resets to default on malformed cache', () => {
    localStorage.setItem(scopedStorageKey('currencies'), 'not-json');
    const defaults = [{ id: 'cur1', code: 'PKR' }];
    const result = getCollection('currencies', defaults);
    expect(result).toEqual(defaults);
  });
});
