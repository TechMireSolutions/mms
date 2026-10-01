import { describe, expect, it } from 'vitest';
import {
  FACULTY_LOOKUP_KINDS,
  FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS,
  defaultFacultyLookupItems,
  emptyFacultyLookupsMap,
  isFacultyLookupKind,
  isFacultyLookupLegacyCollectionKey,
} from './facultyLookupTypes.js';

describe('facultyLookupTypes', () => {
  it('exposes statuses, specializations, genderFilters, designations, and departments Setup kinds', () => {
    expect(FACULTY_LOOKUP_KINDS).toEqual(['statuses', 'specializations', 'genderFilters', 'designations', 'departments']);
    expect(FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS.facultyStatuses).toBe('statuses');
    expect(isFacultyLookupLegacyCollectionKey('facultyStatuses')).toBe(true);
    expect(isFacultyLookupKind('statuses')).toBe(true);
    expect(isFacultyLookupKind('genderFilters')).toBe(true);
    expect(isFacultyLookupKind('designations')).toBe(true);
    expect(isFacultyLookupKind('departments')).toBe(true);
    expect(isFacultyLookupKind('genders')).toBe(false);
  });

  it('defaults statuses, specializations, genderFilters, designations, and departments from shared enums', () => {
    expect(defaultFacultyLookupItems('statuses')).toContain('active');
    expect(defaultFacultyLookupItems('specializations').length).toBeGreaterThan(0);
    expect(defaultFacultyLookupItems('genderFilters')).toEqual(['male', 'female']);
    expect(defaultFacultyLookupItems('designations')).toContain('Instructor');
    expect(defaultFacultyLookupItems('departments')).toContain('Hifz');
    expect(emptyFacultyLookupsMap().statuses.length).toBeGreaterThan(0);
    expect(emptyFacultyLookupsMap().genderFilters).toEqual(['male', 'female']);
    expect(emptyFacultyLookupsMap().designations).toContain('Instructor');
    expect(emptyFacultyLookupsMap().departments).toContain('Hifz');
  });
});

