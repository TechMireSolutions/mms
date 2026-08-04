import type { ContactRelationship, RelationshipContact } from './contactEntityTypes.js';

export type StudentGuardianRole = 'father' | 'mother' | 'guardian';

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

function normalizeRelationshipLabel(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function roleFromRelationshipLabel(label: string): StudentGuardianRole | null {
  if (label === 'father') return 'father';
  if (label === 'mother') return 'mother';
  if (label === 'guardian') return 'guardian';
  return null;
}

/** Merge relationshipContacts + legacy relationships; prefer non-inferred when both exist. */
export function collectContactRelationshipLinks(contact: {
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
}): RelationshipLinkLike[] {
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
 * Derives father/mother/guardian links from a primary contact's relationship graph.
 * Contacts module is the SSOT; student `*ContactId` fields are legacy mirrors.
 */
export function deriveStudentGuardiansFromContact(contact: {
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
}): DerivedStudentGuardianLinks {
  const derived: DerivedStudentGuardianLinks = {};

  for (const link of collectContactRelationshipLinks(contact)) {
    const role = roleFromRelationshipLabel(normalizeRelationshipLabel(link.relationship));
    if (!role) continue;
    const contactId = link.contactId == null ? '' : String(link.contactId).trim();
    const name = (link.name || '').trim();
    if (!contactId && !name) continue;

    const idKey = `${role}ContactId` as const;
    const nameKey = `${role}Name` as const;
    if (derived[idKey] || derived[nameKey]) continue;

    if (contactId) derived[idKey] = contactId;
    if (name) derived[nameKey] = name;
  }

  return derived;
}

/** Prefer Contacts relationships; fall back to legacy student `*ContactId` / `*Name`. */
export function resolveStudentGuardianLinks(
  student: {
    fatherContactId?: string | number | null;
    motherContactId?: string | number | null;
    guardianContactId?: string | number | null;
    fatherName?: string | null;
    motherName?: string | null;
    guardianName?: string | null;
  },
  primaryContact?: {
    relationshipContacts?: RelationshipContact[];
    relationships?: ContactRelationship[];
  } | null,
): DerivedStudentGuardianLinks {
  const derived = primaryContact ? deriveStudentGuardiansFromContact(primaryContact) : {};
  return {
    fatherContactId:
      derived.fatherContactId
      ?? (student.fatherContactId != null && String(student.fatherContactId).trim()
        ? String(student.fatherContactId)
        : undefined),
    motherContactId:
      derived.motherContactId
      ?? (student.motherContactId != null && String(student.motherContactId).trim()
        ? String(student.motherContactId)
        : undefined),
    guardianContactId:
      derived.guardianContactId
      ?? (student.guardianContactId != null && String(student.guardianContactId).trim()
        ? String(student.guardianContactId)
        : undefined),
    fatherName: derived.fatherName ?? (student.fatherName?.trim() || undefined),
    motherName: derived.motherName ?? (student.motherName?.trim() || undefined),
    guardianName: derived.guardianName ?? (student.guardianName?.trim() || undefined),
  };
}
