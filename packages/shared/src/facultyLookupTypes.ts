import { z } from 'zod';
import { GENDERS } from './contactPreferenceConstants.js';
import {
  resolveTeacherDesignations,
  resolveTeacherSpecializations,
  resolveTeacherStatuses,
} from './facultyTypes.js';

/** Teachers Setup option-list kinds migrated off document-store collections. */
export const TEACHER_LOOKUP_KINDS = ['statuses', 'specializations', 'genderFilters', 'designations'] as const;

export type TeacherLookupKind = (typeof TEACHER_LOOKUP_KINDS)[number];

/** Legacy document-store collection key → typed lookup kind. */
export const TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS = {
  teacherStatuses: 'statuses',
  teacherSpecializations: 'specializations',
} as const satisfies Record<string, TeacherLookupKind>;

export type TeacherLookupLegacyCollectionKey = keyof typeof TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS;

export const teacherLookupKindSchema = z.enum(TEACHER_LOOKUP_KINDS);

import { teacherLookupStringItemsSchema } from './schemas/facultyLookup.dto.js';

export const teacherLookupsMapSchema = z.object({
  statuses: teacherLookupStringItemsSchema,
  specializations: teacherLookupStringItemsSchema,
  genderFilters: teacherLookupStringItemsSchema,
  designations: teacherLookupStringItemsSchema.default([]),
});

export type TeacherLookupsMap = z.infer<typeof teacherLookupsMapSchema>;

export const teacherLookupKindParamsSchema = z.object({
  kind: teacherLookupKindSchema,
});

export * from './schemas/facultyLookup.dto.js';

const TEACHER_LOOKUP_KINDS_SET = new Set<string>(TEACHER_LOOKUP_KINDS);

export function isTeacherLookupKind(value: string): value is TeacherLookupKind {
  return TEACHER_LOOKUP_KINDS_SET.has(value);
}

export function isTeacherLookupLegacyCollectionKey(
  value: string,
): value is TeacherLookupLegacyCollectionKey {
  return Object.prototype.hasOwnProperty.call(TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS, value);
}

export function defaultTeacherLookupItems(kind: TeacherLookupKind): string[] {
  switch (kind) {
    case 'statuses':
      return [...resolveTeacherStatuses()];
    case 'specializations':
      return [...resolveTeacherSpecializations()];
    case 'genderFilters':
      return [...GENDERS];
    case 'designations':
      return [...resolveTeacherDesignations()];
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function emptyTeacherLookupsMap(): TeacherLookupsMap {
  return {
    statuses: defaultTeacherLookupItems('statuses'),
    specializations: defaultTeacherLookupItems('specializations'),
    genderFilters: defaultTeacherLookupItems('genderFilters'),
    designations: defaultTeacherLookupItems('designations'),
  };
}

export const FACULTY_LOOKUP_KINDS = TEACHER_LOOKUP_KINDS;
export type FacultyLookupKind = TeacherLookupKind;
export const facultyLookupKindSchema = teacherLookupKindSchema;
export const facultyLookupsMapSchema = teacherLookupsMapSchema;
export type FacultyLookupsMap = TeacherLookupsMap;
export const facultyLookupKindParamsSchema = teacherLookupKindParamsSchema;
export const isFacultyLookupKind = isTeacherLookupKind;
export const emptyFacultyLookupsMap = emptyTeacherLookupsMap;
export const defaultFacultyLookupItems = defaultTeacherLookupItems;

