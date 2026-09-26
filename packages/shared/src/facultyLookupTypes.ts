import { z } from 'zod';
import { GENDERS } from './contactPreferenceConstants.js';
import {
  resolveFacultyDesignations,
  resolveFacultySpecializations,
  resolveFacultyStatuses,
} from './facultyTypes.js';

/** Faculty Setup option-list kinds migrated off document-store collections. */
export const FACULTY_LOOKUP_KINDS = ['statuses', 'specializations', 'genderFilters', 'designations'] as const;

export type FacultyLookupKind = (typeof FACULTY_LOOKUP_KINDS)[number];

/** Legacy document-store collection key → typed lookup kind. */
export const FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS = {
  facultyStatuses: 'statuses',
  facultySpecializations: 'specializations',
  teacherStatuses: 'statuses',
  teacherSpecializations: 'specializations',
} as const satisfies Record<string, FacultyLookupKind>;

export type FacultyLookupLegacyCollectionKey = keyof typeof FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS;

export const facultyLookupKindSchema = z.enum(FACULTY_LOOKUP_KINDS);

import { facultyLookupStringItemsSchema } from './schemas/facultyLookup.dto.js';

export const facultyLookupsMapSchema = z.object({
  statuses: facultyLookupStringItemsSchema,
  specializations: facultyLookupStringItemsSchema,
  genderFilters: facultyLookupStringItemsSchema,
  designations: facultyLookupStringItemsSchema.default([]),
});

export type FacultyLookupsMap = z.infer<typeof facultyLookupsMapSchema>;

export const facultyLookupKindParamsSchema = z.object({
  kind: facultyLookupKindSchema,
});

export * from './schemas/facultyLookup.dto.js';

const FACULTY_LOOKUP_KINDS_SET = new Set<string>(FACULTY_LOOKUP_KINDS);

export function isFacultyLookupKind(value: string): value is FacultyLookupKind {
  return FACULTY_LOOKUP_KINDS_SET.has(value);
}

export function isFacultyLookupLegacyCollectionKey(
  value: string,
): value is FacultyLookupLegacyCollectionKey {
  return Object.prototype.hasOwnProperty.call(FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS, value);
}

export function defaultFacultyLookupItems(kind: FacultyLookupKind): string[] {
  switch (kind) {
    case 'statuses':
      return [...resolveFacultyStatuses()];
    case 'specializations':
      return [...resolveFacultySpecializations()];
    case 'genderFilters':
      return [...GENDERS];
    case 'designations':
      return [...resolveFacultyDesignations()];
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function emptyFacultyLookupsMap(): FacultyLookupsMap {
  return {
    statuses: defaultFacultyLookupItems('statuses'),
    specializations: defaultFacultyLookupItems('specializations'),
    genderFilters: defaultFacultyLookupItems('genderFilters'),
    designations: defaultFacultyLookupItems('designations'),
  };
}

/* ========================================================================= */
/*                    BACKWARD COMPATIBILITY ALIASES                        */
/* ========================================================================= */

export const TEACHER_LOOKUP_KINDS = FACULTY_LOOKUP_KINDS;
export type TeacherLookupKind = FacultyLookupKind;
export const TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS = FACULTY_LOOKUP_LEGACY_COLLECTION_KEYS;
export type TeacherLookupLegacyCollectionKey = FacultyLookupLegacyCollectionKey;
export const teacherLookupKindSchema = facultyLookupKindSchema;
export const teacherLookupsMapSchema = facultyLookupsMapSchema;
export type TeacherLookupsMap = FacultyLookupsMap;
export const teacherLookupKindParamsSchema = facultyLookupKindParamsSchema;
export const isTeacherLookupKind = isFacultyLookupKind;
export const isTeacherLookupLegacyCollectionKey = isFacultyLookupLegacyCollectionKey;
export const defaultTeacherLookupItems = defaultFacultyLookupItems;
export const emptyTeacherLookupsMap = emptyFacultyLookupsMap;

