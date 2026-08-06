import type { ContactRelationship, RelationshipContact } from './contactEntityTypes.js';
import { isAllowedRelationshipLabel, normalizeRelationshipTerm } from './contactRelationshipRules.js';
import { DEFAULT_RELATIONSHIP_PAIRS } from './contactRelationshipPairUtils.js';

function pairForwardLabel(pairId: string): string {
  const pair = DEFAULT_RELATIONSHIP_PAIRS.find((entry) => entry.id === pairId);
  return pair?.forward ?? pairId;
}

/** Catalog forward label for Parent (system pair `parent_child`). */
export const STUDENT_PARENT_RELATIONSHIP_LABEL = pairForwardLabel('parent_child');
/** Catalog forward label for Guardian (system pair `guardian_dependent`). */
export const STUDENT_GUARDIAN_RELATIONSHIP_LABEL = pairForwardLabel('guardian_dependent');

export type StudentContactRelationshipLink = {
  contactId?: string;
  name?: string;
  phone?: string;
  /** Linked contact gender when known (for Parent/Child display mapping). */
  gender?: string;
  relationship: string;
};

/** @deprecated Triad shape kept only for list/detail hydrate slots (Parent → father*, Guardian → guardian*). */
export type DerivedStudentGuardianLinks = {
  fatherContactId?: string;
  motherContactId?: string;
  guardianContactId?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
};

type RelationshipLinkLike = {
  contactId?: string | number | null;
  name?: string;
  phone?: string;
  relationship?: string;
  inferred?: boolean;
};

type ContactWithRelationships = {
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
};

const RESPONSIBLE_ADULT_LABELS = new Set(['parent', 'guardian']);

/** Merge relationshipContacts + legacy relationships; prefer non-inferred when both exist. */
export function collectContactRelationshipLinks(contact: ContactWithRelationships): RelationshipLinkLike[] {
  const byKey = new Map<string, RelationshipLinkLike>();

  const add = (entry: RelationshipLinkLike) => {
    const contactId = entry.contactId == null ? '' : String(entry.contactId).trim();
    const name = (entry.name || '').trim();
    const phone = (entry.phone || '').trim();
    if (!contactId && !name && !phone) return;

    const key = contactId || (name ? `name:${name.toLowerCase()}` : `phone:${phone}`);
    const existing = byKey.get(key);
    if (existing && existing.inferred !== true && entry.inferred === true) return;
    byKey.set(key, {
      contactId,
      name: name || existing?.name,
      phone: phone || existing?.phone,
      relationship: entry.relationship || existing?.relationship,
      inferred: entry.inferred === true,
    });
  };

  for (const entry of contact.relationshipContacts ?? []) add(entry);
  for (const entry of contact.relationships ?? []) add(entry);

  return [...byKey.values()];
}

/**
 * Lists the student contact’s relationship links that use the fixed system catalog
 * (Parent/Child, Husband/Wife, Guardian/Dependent).
 */
export function listStudentContactRelationships(
  contact?: ContactWithRelationships | null,
): StudentContactRelationshipLink[] {
  if (!contact) return [];
  const links: StudentContactRelationshipLink[] = [];
  for (const link of collectContactRelationshipLinks(contact)) {
    const relationship = (link.relationship || '').trim();
    if (!relationship || !isAllowedRelationshipLabel(relationship)) continue;
    const contactId = link.contactId == null ? '' : String(link.contactId).trim();
    const name = (link.name || '').trim();
    if (!contactId && !name) continue;
    links.push({
      ...(contactId ? { contactId } : {}),
      ...(name ? { name } : {}),
      ...(link.phone ? { phone: link.phone } : {}),
      relationship,
    });
  }
  return links;
}

/** True when the contact has a Parent or Guardian link (responsible adult). */
export function hasResponsibleAdultLink(contact?: ContactWithRelationships | null): boolean {
  return listStudentContactRelationships(contact).some((link) =>
    RESPONSIBLE_ADULT_LABELS.has(normalizeRelationshipTerm(link.relationship)),
  );
}

/** First Parent link, else first Guardian link — for list/detail primary display. */
export function pickPrimaryResponsibleAdult(
  links: readonly StudentContactRelationshipLink[],
): StudentContactRelationshipLink | undefined {
  const parent = links.find(
    (link) => normalizeRelationshipTerm(link.relationship) === 'parent',
  );
  if (parent) return parent;
  return links.find((link) => normalizeRelationshipTerm(link.relationship) === 'guardian');
}

/** Display name for list/export: Parent hydrate slot, else Guardian. */
export function primaryResponsibleAdultDisplayName(student: {
  fatherName?: string | null;
  guardianName?: string | null;
}): string {
  return (student.fatherName || student.guardianName || '').trim();
}

/**
 * Display slots for list/hydrate: Parent → father*, Guardian → guardian*.
 * Mother slots are cleared (obsolete triad). Legacy student *ContactId used only when
 * the contact graph has no matching Parent/Guardian link.
 */
export function resolveStudentGuardianLinks(
  student: {
    fatherContactId?: string | number | null;
    motherContactId?: string | number | null;
    guardianContactId?: string | number | null;
    fatherName?: string | null;
    motherName?: string | null;
    guardianName?: string | null;
  },
  primaryContact?: ContactWithRelationships | null,
): DerivedStudentGuardianLinks {
  const links = listStudentContactRelationships(primaryContact);
  const parent = links.find(
    (link) => normalizeRelationshipTerm(link.relationship) === 'parent',
  );
  const guardian = links.find(
    (link) => normalizeRelationshipTerm(link.relationship) === 'guardian',
  );

  const legacyFatherId =
    student.fatherContactId != null && String(student.fatherContactId).trim()
      ? String(student.fatherContactId)
      : undefined;
  const legacyGuardianId =
    student.guardianContactId != null && String(student.guardianContactId).trim()
      ? String(student.guardianContactId)
      : undefined;

  return {
    fatherContactId: parent?.contactId ?? legacyFatherId,
    fatherName: parent?.name ?? (student.fatherName?.trim() || undefined),
    motherContactId: undefined,
    motherName: undefined,
    guardianContactId: guardian?.contactId ?? legacyGuardianId,
    guardianName: guardian?.name ?? (student.guardianName?.trim() || undefined),
  };
}

/** @deprecated Use {@link listStudentContactRelationships}. */
export function deriveStudentGuardiansFromContact(
  contact: ContactWithRelationships,
): DerivedStudentGuardianLinks {
  return resolveStudentGuardianLinks({}, contact);
}
