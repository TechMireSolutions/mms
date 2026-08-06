/**
 * Display-only sibling derivation from Parent/Child graph edges.
 * Does not persist; not part of the FormSelect relationship catalog.
 */
import type { ContactRelationship, RelationshipContact } from './contactEntityTypes.js';
import { normalizeRelationshipTerm } from './contactRelationshipRules.js';
import { collectContactRelationshipLinks } from './studentGuardianFromContacts.js';

export const DERIVED_SIBLING_RELATIONSHIP_LABEL = 'Sibling';

export type DerivedSiblingLink = {
  contactId: string;
  relationship: typeof DERIVED_SIBLING_RELATIONSHIP_LABEL;
  /** True for drawer/metadata merge only — never written to storage. */
  derivedSibling: true;
  name?: string;
  phone?: string;
  gender?: string;
};

type ContactLike = {
  id?: string | number | null;
  name?: string;
  phone?: string;
  gender?: string;
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
};

function contactIdOf(contact: ContactLike): string {
  return contact.id == null ? '' : String(contact.id).trim();
}

function isParentLabel(relationship?: string): boolean {
  return normalizeRelationshipTerm(relationship) === 'parent';
}

function isChildLabel(relationship?: string): boolean {
  return normalizeRelationshipTerm(relationship) === 'child';
}

/** Parent contact ids of `subject` via Parent links on subject or Child links on peers. */
export function collectParentIdsOf(
  subject: ContactLike,
  contactsById: ReadonlyMap<string, ContactLike>,
): Set<string> {
  const subjectId = contactIdOf(subject);
  const parentIds = new Set<string>();

  for (const link of collectContactRelationshipLinks(subject)) {
    const peerId = link.contactId == null ? '' : String(link.contactId).trim();
    if (!peerId || peerId === subjectId) continue;
    if (isParentLabel(link.relationship)) parentIds.add(peerId);
  }

  for (const [peerId, peer] of contactsById) {
    if (!peerId || peerId === subjectId) continue;
    for (const link of collectContactRelationshipLinks(peer)) {
      const linkedId = link.contactId == null ? '' : String(link.contactId).trim();
      if (linkedId === subjectId && isChildLabel(link.relationship)) {
        parentIds.add(peerId);
      }
    }
  }

  return parentIds;
}

/** Child contact ids of `parentId` via Child links on parent or Parent links on peers. */
export function collectChildIdsOf(
  parentId: string,
  contactsById: ReadonlyMap<string, ContactLike>,
): Set<string> {
  const childIds = new Set<string>();
  const parent = contactsById.get(parentId);
  if (parent) {
    for (const link of collectContactRelationshipLinks(parent)) {
      const peerId = link.contactId == null ? '' : String(link.contactId).trim();
      if (!peerId || peerId === parentId) continue;
      if (isChildLabel(link.relationship)) childIds.add(peerId);
    }
  }

  for (const [peerId, peer] of contactsById) {
    if (!peerId || peerId === parentId) continue;
    for (const link of collectContactRelationshipLinks(peer)) {
      const linkedId = link.contactId == null ? '' : String(link.contactId).trim();
      if (linkedId === parentId && isParentLabel(link.relationship)) {
        childIds.add(peerId);
      }
    }
  }

  return childIds;
}

/**
 * Co-children who share at least one Parent with `subject` (Parent/Child edges only).
 * Returns display-only Sibling rows; skips ids already present if caller merges carefully.
 */
export function deriveSiblingLinks(
  subject: ContactLike,
  contacts: readonly ContactLike[],
): DerivedSiblingLink[] {
  const subjectId = contactIdOf(subject);
  if (!subjectId) return [];

  const contactsById = new Map<string, ContactLike>();
  contactsById.set(subjectId, subject);
  for (const contact of contacts) {
    const id = contactIdOf(contact);
    if (id) contactsById.set(id, contact);
  }

  const parentIds = collectParentIdsOf(subject, contactsById);
  if (parentIds.size === 0) return [];

  const siblingIds = new Set<string>();
  for (const parentId of parentIds) {
    for (const childId of collectChildIdsOf(parentId, contactsById)) {
      if (childId !== subjectId) siblingIds.add(childId);
    }
  }

  const links: DerivedSiblingLink[] = [];
  for (const siblingId of siblingIds) {
    const peer = contactsById.get(siblingId);
    const name = peer?.name?.trim();
    const gender = peer?.gender?.trim();
    links.push({
      contactId: siblingId,
      relationship: DERIVED_SIBLING_RELATIONSHIP_LABEL,
      derivedSibling: true,
      ...(name ? { name } : {}),
      ...(gender ? { gender } : {}),
    });
  }

  return links.sort((left, right) => left.contactId.localeCompare(right.contactId));
}
