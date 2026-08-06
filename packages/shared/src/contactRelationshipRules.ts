import type { Contact, RelationshipPair } from './contactEntityTypes.js';
import {
  deriveRelationshipOptionsFromPairs,
  normalizeRelationshipTerm,
} from './contactRelationshipPairUtils.js';

export { normalizeRelationshipTerm } from './contactRelationshipPairUtils.js';

export interface RelationshipLink {
  contactId: string;
  relationship?: string;
  inferred: boolean;
}

export interface PlannedRelationship {
  ownerId: string;
  contactId: string;
  relationship: string;
  inferredFromContactId: string;
  inferenceDepth: number;
}

function isFemale(contact: Contact): boolean {
  const gender = typeof contact.gender === 'string' ? contact.gender.trim().toLowerCase() : '';
  return gender === 'female' || gender === 'f' || gender === 'woman' || gender === 'girl';
}

function isMale(contact: Contact): boolean {
  const gender = typeof contact.gender === 'string' ? contact.gender.trim().toLowerCase() : '';
  return gender === 'male' || gender === 'm' || gender === 'man' || gender === 'boy';
}

/**
 * True when `label` appears in the tenant’s pair-derived relationship option set.
 */
export function isAllowedRelationshipLabel(
  label: string,
  pairs: RelationshipPair[] | undefined,
): boolean {
  const norm = normalizeRelationshipTerm(label);
  if (!norm) return false;
  return deriveRelationshipOptionsFromPairs(pairs ?? []).some(
    (option) => normalizeRelationshipTerm(option) === norm,
  );
}

/**
 * Resolves the reciprocal relationship label from configured pairs only.
 * Returns null when no pair matches — never invents built-in labels.
 */
export function resolveInverseRelationship(
  relationship: string,
  sourceContact: Contact,
  customPairs?: RelationshipPair[],
): string | null {
  if (!relationship || !relationship.trim()) return null;
  if (!customPairs || customPairs.length === 0) return null;

  const norm = normalizeRelationshipTerm(relationship);

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
      return pair.forward;
    }
  }

  return null;
}
