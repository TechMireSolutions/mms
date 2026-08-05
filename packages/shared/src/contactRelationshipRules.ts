import type { Contact, RelationshipPair } from './contactEntityTypes.js';

export type RelationshipRole =
  | 'parent'
  | 'child'
  | 'sibling'
  | 'spouse'
  | 'guardian'
  | 'dependent'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'
  | 'parent_in_law'
  | 'child_in_law'
  | 'sibling_in_law'
  | 'other';

export interface RelationshipLink {
  contactId: string;
  role: RelationshipRole;
  relationship?: string;
  inferred: boolean;
}

export interface PlannedRelationship {
  ownerId: string;
  contactId: string;
  relationship: string;
  overwriteExisting: boolean;
  priority: number;
  inferredFromContactId: string;
  inferenceDepth: number;
}

export const ROLE_BY_TERM = new Map<string, RelationshipRole>([
  ['father', 'parent'],
  ['mother', 'parent'],
  ['parent', 'parent'],
  ['son', 'child'],
  ['daughter', 'child'],
  ['child', 'child'],
  ['brother', 'sibling'],
  ['sister', 'sibling'],
  ['sibling', 'sibling'],
  ['spouse', 'spouse'],
  ['husband', 'spouse'],
  ['wife', 'spouse'],
  ['guardian', 'guardian'],
  ['dependent', 'dependent'],
  ['ward', 'dependent'],
  ['grandfather', 'grandparent'],
  ['grandmother', 'grandparent'],
  ['grandparent', 'grandparent'],
  ['grandson', 'grandchild'],
  ['granddaughter', 'grandchild'],
  ['grandchild', 'grandchild'],
  ['uncle', 'aunt_uncle'],
  ['aunt', 'aunt_uncle'],
  ['aunt/uncle', 'aunt_uncle'],
  ['nephew', 'niece_nephew'],
  ['niece', 'niece_nephew'],
  ['niece/nephew', 'niece_nephew'],
  ['cousin', 'cousin'],
  ['father-in-law', 'parent_in_law'],
  ['mother-in-law', 'parent_in_law'],
  ['parent-in-law', 'parent_in_law'],
  ['son-in-law', 'child_in_law'],
  ['daughter-in-law', 'child_in_law'],
  ['child-in-law', 'child_in_law'],
  ['brother-in-law', 'sibling_in_law'],
  ['sister-in-law', 'sibling_in_law'],
  ['sibling-in-law', 'sibling_in_law'],
  ['other', 'other'],
]);

export const PRIMARY_TRIGGER_ROLES = new Set<RelationshipRole>(['parent', 'child', 'sibling', 'spouse']);
export const DIRECT_RELATIONSHIP_PRIORITY = 100;
export const INFERRED_RELATIONSHIP_PRIORITY = 50;

export interface RelationshipInferenceRule {
  from: RelationshipRole;
  through: RelationshipRole;
  result: RelationshipRole;
}

// Keep this table limited to high-confidence paths; ambiguous family paths should stay manual.
export const RELATIONSHIP_INFERENCE_RULES: RelationshipInferenceRule[] = [
  { from: 'parent', through: 'parent', result: 'grandparent' },
  { from: 'parent', through: 'child', result: 'sibling' },
  { from: 'parent', through: 'sibling', result: 'aunt_uncle' },
  { from: 'parent', through: 'spouse', result: 'parent' },
  { from: 'aunt_uncle', through: 'child', result: 'cousin' },
  { from: 'sibling', through: 'parent', result: 'parent' },
  { from: 'sibling', through: 'child', result: 'niece_nephew' },
  { from: 'sibling', through: 'sibling', result: 'sibling' },
  { from: 'sibling', through: 'spouse', result: 'sibling_in_law' },
  { from: 'child', through: 'child', result: 'grandchild' },
  { from: 'child', through: 'sibling', result: 'child' },
  { from: 'child', through: 'spouse', result: 'child_in_law' },
  { from: 'spouse', through: 'parent', result: 'parent_in_law' },
  { from: 'spouse', through: 'sibling', result: 'sibling_in_law' },
];

export const RELATIONSHIP_INFERENCE_RULE_BY_PATH = new Map(
  RELATIONSHIP_INFERENCE_RULES.map((rule) => [`${rule.from}:${rule.through}`, rule.result] as const),
);

export function normalizeRelationshipTerm(relationship: unknown): string {
  if (typeof relationship !== 'string') return '';
  return relationship
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+in\s+law/g, '-in-law')
    .replace(/\s+/g, ' ');
}

export function relationshipRole(relationship: unknown): RelationshipRole {
  return ROLE_BY_TERM.get(normalizeRelationshipTerm(relationship)) ?? 'other';
}

function isFemale(contact: Contact): boolean {
  const gender = typeof contact.gender === 'string' ? contact.gender.trim().toLowerCase() : '';
  return gender === 'female' || gender === 'f' || gender === 'woman' || gender === 'girl';
}

function isMale(contact: Contact): boolean {
  const gender = typeof contact.gender === 'string' ? contact.gender.trim().toLowerCase() : '';
  return gender === 'male' || gender === 'm' || gender === 'man' || gender === 'boy';
}

function genderedRelationship(contact: Contact, maleTerm: string, femaleTerm: string, neutralTerm: string): string {
  if (isFemale(contact)) return femaleTerm;
  if (isMale(contact)) return maleTerm;
  return neutralTerm;
}

export function relationshipLabel(role: RelationshipRole, contact: Contact): string {
  switch (role) {
    case 'parent':
      return genderedRelationship(contact, 'Father', 'Mother', 'Parent');
    case 'child':
      return genderedRelationship(contact, 'Son', 'Daughter', 'Child');
    case 'sibling':
      return genderedRelationship(contact, 'Brother', 'Sister', 'Sibling');
    case 'spouse':
      return genderedRelationship(contact, 'Husband', 'Wife', 'Spouse');
    case 'guardian':
      return 'Guardian';
    case 'dependent':
      return 'Dependent';
    case 'grandparent':
      return genderedRelationship(contact, 'Grandfather', 'Grandmother', 'Grandparent');
    case 'grandchild':
      return genderedRelationship(contact, 'Grandson', 'Granddaughter', 'Grandchild');
    case 'aunt_uncle':
      return genderedRelationship(contact, 'Uncle', 'Aunt', 'Aunt/Uncle');
    case 'niece_nephew':
      return genderedRelationship(contact, 'Nephew', 'Niece', 'Niece/Nephew');
    case 'cousin':
      return 'Cousin';
    case 'parent_in_law':
      return genderedRelationship(contact, 'Father-In-Law', 'Mother-In-Law', 'Parent-In-Law');
    case 'child_in_law':
      return genderedRelationship(contact, 'Son-In-Law', 'Daughter-In-Law', 'Child-In-Law');
    case 'sibling_in_law':
      return genderedRelationship(contact, 'Brother-In-Law', 'Sister-In-Law', 'Sibling-In-Law');
    case 'other':
      return 'Other';
  }
}

export function inverseRole(role: RelationshipRole): RelationshipRole {
  switch (role) {
    case 'parent':
      return 'child';
    case 'child':
      return 'parent';
    case 'grandparent':
      return 'grandchild';
    case 'grandchild':
      return 'grandparent';
    case 'aunt_uncle':
      return 'niece_nephew';
    case 'niece_nephew':
      return 'aunt_uncle';
    case 'guardian':
      return 'dependent';
    case 'dependent':
      return 'guardian';
    case 'spouse':
    case 'sibling':
    case 'cousin':
      return role;
    case 'parent_in_law':
      return 'child_in_law';
    case 'child_in_law':
      return 'parent_in_law';
    case 'sibling_in_law':
    case 'other':
      return role;
  }
}

export function composeRelationship(first: RelationshipRole, second: RelationshipRole): RelationshipRole | null {
  return RELATIONSHIP_INFERENCE_RULE_BY_PATH.get(`${first}:${second}`) ?? null;
}

/**
 * Resolves the reciprocal (2nd side) relationship label for a source contact.
 * Checks custom dynamic 2-side pairs, standard built-in roles, then falls back to symmetric labeling.
 */
export function resolveInverseRelationship(
  relationship: string,
  sourceContact: Contact,
  customPairs?: RelationshipPair[],
): string {
  if (!relationship || !relationship.trim()) return 'Other';
  const norm = normalizeRelationshipTerm(relationship);

  // 1. Custom configured 2-sided pairs check (including gendered inverse labels)
  if (customPairs && customPairs.length > 0) {
    for (const pair of customPairs) {
      const normFwd = normalizeRelationshipTerm(pair.forward);
      const normInv = normalizeRelationshipTerm(pair.inverse);
      const normInvMale = normalizeRelationshipTerm(pair.inverseMale);
      const normInvFemale = normalizeRelationshipTerm(pair.inverseFemale);
      if (norm === normFwd) {
        if (isFemale(sourceContact) && pair.inverseFemale) return pair.inverseFemale;
        if (isMale(sourceContact) && pair.inverseMale) return pair.inverseMale;
        return pair.inverse;
      }
      if (norm === normInv || (normInvMale && norm === normInvMale) || (normInvFemale && norm === normInvFemale)) {
        const fwdRole = relationshipRole(pair.forward);
        if (fwdRole !== 'other') {
          return relationshipLabel(fwdRole, sourceContact);
        }
        return pair.forward;
      }
    }
  }

  // 2. Built-in standard relationship roles check
  const role = relationshipRole(relationship);
  if (role !== 'other') {
    const invRole = inverseRole(role);
    return relationshipLabel(invRole, sourceContact);
  }

  // 3. Fallback for unlisted dynamic relationship types: preserve symmetric reciprocal pair
  const trimmed = relationship.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
