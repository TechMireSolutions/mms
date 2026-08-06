import { z } from 'zod';
import { GENDERS } from './contactPreferenceConstants.js';
import { STUDENT_STATUS_VALUES } from './studentTypes.js';

/** Students Setup option-list kinds migrated off document-store collections. */
export const STUDENT_LOOKUP_KINDS = ['statuses', 'genderFilters', 'discountTypes'] as const;

export type StudentLookupKind = (typeof STUDENT_LOOKUP_KINDS)[number];

/** Legacy document-store collection key → typed lookup kind. */
export const STUDENT_LOOKUP_LEGACY_COLLECTION_KEYS = {
  studentStatuses: 'statuses',
  studentGenderFilters: 'genderFilters',
  studentDiscountTypes: 'discountTypes',
} as const satisfies Record<string, StudentLookupKind>;

export type StudentLookupLegacyCollectionKey = keyof typeof STUDENT_LOOKUP_LEGACY_COLLECTION_KEYS;

export const studentLookupKindSchema = z.enum(STUDENT_LOOKUP_KINDS);

export const studentLookupStringItemsSchema = z.array(z.string().min(1).max(200)).max(500);

export const studentLookupsMapSchema = z.object({
  statuses: studentLookupStringItemsSchema,
  genderFilters: studentLookupStringItemsSchema,
  discountTypes: studentLookupStringItemsSchema,
});

export type StudentLookupsMap = z.infer<typeof studentLookupsMapSchema>;

export const studentLookupKindParamsSchema = z.object({
  kind: studentLookupKindSchema,
});

export const studentLookupPutBodySchema = z.object({
  items: studentLookupStringItemsSchema,
});

export function isStudentLookupKind(value: string): value is StudentLookupKind {
  return (STUDENT_LOOKUP_KINDS as readonly string[]).includes(value);
}

export function isStudentLookupLegacyCollectionKey(
  value: string,
): value is StudentLookupLegacyCollectionKey {
  return Object.prototype.hasOwnProperty.call(STUDENT_LOOKUP_LEGACY_COLLECTION_KEYS, value);
}

export function defaultStudentLookupItems(kind: StudentLookupKind): string[] {
  switch (kind) {
    case 'statuses':
      return [...STUDENT_STATUS_VALUES];
    case 'genderFilters':
      return [...GENDERS];
    case 'discountTypes':
      return [];
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function emptyStudentLookupsMap(): StudentLookupsMap {
  return {
    statuses: defaultStudentLookupItems('statuses'),
    genderFilters: defaultStudentLookupItems('genderFilters'),
    discountTypes: defaultStudentLookupItems('discountTypes'),
  };
}
