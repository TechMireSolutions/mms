import { describe, expect, it } from 'vitest';
import {
  TEACHER_LOOKUP_KINDS,
  TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS,
  defaultTeacherLookupItems,
  emptyTeacherLookupsMap,
  isTeacherLookupKind,
  isTeacherLookupLegacyCollectionKey,
} from './teacherLookupTypes.js';

describe('teacherLookupTypes', () => {
  it('exposes two Setup kinds mapped from legacy collections', () => {
    expect(TEACHER_LOOKUP_KINDS).toEqual(['statuses', 'specializations']);
    expect(TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS.teacherStatuses).toBe('statuses');
    expect(isTeacherLookupLegacyCollectionKey('teacherStatuses')).toBe(true);
    expect(isTeacherLookupKind('statuses')).toBe(true);
    expect(isTeacherLookupKind('genders')).toBe(false);
  });

  it('defaults statuses and specializations from shared enums', () => {
    expect(defaultTeacherLookupItems('statuses')).toContain('active');
    expect(defaultTeacherLookupItems('specializations').length).toBeGreaterThan(0);
    expect(emptyTeacherLookupsMap().statuses.length).toBeGreaterThan(0);
  });
});
