import { z } from 'zod';
import { GENDERS } from './contactPreferenceConstants.js';
import {
  resolveTeacherSpecializations,
  resolveTeacherStatuses,
} from './teacherTypes.js';

/** Teachers Setup option-list kinds migrated off document-store collections. */
export const TEACHER_LOOKUP_KINDS = ['statuses', 'specializations', 'genderFilters'] as const;

export type TeacherLookupKind = (typeof TEACHER_LOOKUP_KINDS)[number];

/** Legacy document-store collection key → typed lookup kind. */
export const TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS = {
  teacherStatuses: 'statuses',
  teacherSpecializations: 'specializations',
} as const satisfies Record<string, TeacherLookupKind>;

export type TeacherLookupLegacyCollectionKey = keyof typeof TEACHER_LOOKUP_LEGACY_COLLECTION_KEYS;

export const teacherLookupKindSchema = z.enum(TEACHER_LOOKUP_KINDS);

export const teacherLookupStringItemsSchema = z.array(z.string().min(1).max(200)).max(500);

export const teacherLookupsMapSchema = z.object({
  statuses: teacherLookupStringItemsSchema,
  specializations: teacherLookupStringItemsSchema,
  genderFilters: teacherLookupStringItemsSchema,
});

export type TeacherLookupsMap = z.infer<typeof teacherLookupsMapSchema>;

export const teacherLookupKindParamsSchema = z.object({
  kind: teacherLookupKindSchema,
});

export const teacherLookupPutBodySchema = z.object({
  items: teacherLookupStringItemsSchema,
});

export function isTeacherLookupKind(value: string): value is TeacherLookupKind {
  return (TEACHER_LOOKUP_KINDS as readonly string[]).includes(value);
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
  };
}
