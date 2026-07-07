import { type Contact, type ContactRelationship, type EmergencyContact } from '@mms/shared';
import { bulkSaveContacts, findContactsByIds } from '../db/repositories/contactRepository.js';

type RelationshipRole =
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

interface RelationshipLink {
  contactId: string;
  role: RelationshipRole;
  relationship?: string;
  inferred: boolean;
}

interface PlannedRelationship {
  ownerId: string;
  contactId: string;
  relationship: string;
  overwriteExisting: boolean;
  priority: number;
  inferredFromContactId: string;
  inferenceDepth: number;
}

const ROLE_BY_TERM = new Map<string, RelationshipRole>([
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

const PRIMARY_TRIGGER_ROLES = new Set<RelationshipRole>(['parent', 'child', 'sibling', 'spouse']);
const DIRECT_RELATIONSHIP_PRIORITY = 100;
const INFERRED_RELATIONSHIP_PRIORITY = 50;

interface RelationshipInferenceRule {
  from: RelationshipRole;
  through: RelationshipRole;
  result: RelationshipRole;
}

// Keep this table limited to high-confidence paths; ambiguous family paths should stay manual.
const RELATIONSHIP_INFERENCE_RULES: RelationshipInferenceRule[] = [
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

const RELATIONSHIP_INFERENCE_RULE_BY_PATH = new Map(
  RELATIONSHIP_INFERENCE_RULES.map((rule) => [`${rule.from}:${rule.through}`, rule.result] as const),
);

function normalizeRelationshipTerm(relationship: unknown): string {
  if (typeof relationship !== 'string') return '';
  return relationship
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+in\s+law/g, '-in-law')
    .replace(/\s+/g, ' ');
}

function relationshipRole(relationship: unknown): RelationshipRole {
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

function relationshipLabel(role: RelationshipRole, contact: Contact): string {
  switch (role) {
    case 'parent':
      return genderedRelationship(contact, 'Father', 'Mother', 'Parent');
    case 'child':
      return genderedRelationship(contact, 'Son', 'Daughter', 'Child');
    case 'sibling':
      return genderedRelationship(contact, 'Brother', 'Sister', 'Sibling');
    case 'spouse':
      return 'Spouse';
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

function inverseRole(role: RelationshipRole): RelationshipRole {
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

function composeRelationship(first: RelationshipRole, second: RelationshipRole): RelationshipRole | null {
  return RELATIONSHIP_INFERENCE_RULE_BY_PATH.get(`${first}:${second}`) ?? null;
}

function linksForContact(contact: Contact): RelationshipLink[] {
  const collect = (entry: EmergencyContact | ContactRelationship): RelationshipLink | null => {
    const contactId = entry.contactId == null ? '' : String(entry.contactId);
    if (!contactId.trim()) return null;
    return {
      contactId,
      relationship: entry.relationship,
      role: relationshipRole(entry.relationship),
      inferred: 'inferred' in entry && entry.inferred === true,
    };
  };

  return [...(contact.emergencyContacts ?? []), ...(contact.relationships ?? [])]
    .map(collect)
    .filter((entry): entry is RelationshipLink => Boolean(entry));
}

function hasManualRelationship(contact: Contact, contactId: string): boolean {
  return linksForContact(contact).some((entry) => entry.contactId === contactId && !entry.inferred);
}

function setEmergencyRelationship(contact: Contact, planned: PlannedRelationship): Contact {
  const emergencyContacts = contact.emergencyContacts ?? [];
  const existingIndex = emergencyContacts.findIndex((entry) => String(entry.contactId) === planned.contactId);
  const relationshipEntry: EmergencyContact = {
    contactId: planned.contactId,
    relationship: planned.relationship,
    inferred: true,
    inferredFromContactId: planned.inferredFromContactId,
    inferenceDepth: planned.inferenceDepth,
  };
  const nextEmergencyContacts =
    existingIndex >= 0
      ? emergencyContacts.map((entry, index) => (index === existingIndex ? { ...entry, ...relationshipEntry } : entry))
      : [...emergencyContacts, relationshipEntry];

  return {
    ...contact,
    emergencyContacts: nextEmergencyContacts,
  };
}

function planRelationship(planned: Map<string, PlannedRelationship>, relationship: PlannedRelationship): void {
  const key = `${relationship.ownerId}:${relationship.contactId}`;
  const existing = planned.get(key);
  if (!existing || relationship.priority > existing.priority) {
    planned.set(key, relationship);
  }
}

function collectContactIds(contacts: Contact[]): string[] {
  return Array.from(
    new Set(
      contacts
        .flatMap((contact) => linksForContact(contact).map((entry) => entry.contactId))
        .filter((id) => id.trim()),
    ),
  );
}

export async function applyContactRelationshipInference(tenant: string, sourceContact: Contact): Promise<void> {
  const sourceId = String(sourceContact.id);
  const sourceLinks = linksForContact(sourceContact).filter((entry) => entry.contactId !== sourceId);
  if (sourceLinks.length === 0) return;

  const firstIds = Array.from(new Set(sourceLinks.map((entry) => entry.contactId)));
  const firstContacts = await findContactsByIds(tenant, firstIds);
  const knownIds = new Set([sourceId, ...firstContacts.map((contact) => String(contact.id))]);
  const secondIds = collectContactIds(firstContacts).filter((id) => !knownIds.has(id));
  const secondContacts = secondIds.length > 0 ? await findContactsByIds(tenant, secondIds) : [];
  for (const contact of secondContacts) {
    knownIds.add(String(contact.id));
  }
  const thirdIds = collectContactIds(secondContacts).filter((id) => !knownIds.has(id));
  const thirdContacts = thirdIds.length > 0 ? await findContactsByIds(tenant, thirdIds) : [];
  const contactsById = new Map<string, Contact>([
    [sourceId, sourceContact],
    ...firstContacts.map((contact) => [String(contact.id), contact] as const),
    ...secondContacts.map((contact) => [String(contact.id), contact] as const),
    ...thirdContacts.map((contact) => [String(contact.id), contact] as const),
  ]);
  const planned = new Map<string, PlannedRelationship>();

  for (const sourceLink of sourceLinks) {
    const target = contactsById.get(sourceLink.contactId);
    if (!target || target.deletedAt) continue;

    const inverseDirectRole = inverseRole(sourceLink.role);
    planRelationship(planned, {
      ownerId: sourceLink.contactId,
      contactId: sourceId,
      relationship: relationshipLabel(inverseDirectRole, sourceContact),
      overwriteExisting: true,
      priority: DIRECT_RELATIONSHIP_PRIORITY,
      inferredFromContactId: sourceId,
      inferenceDepth: 1,
    });

    if (!PRIMARY_TRIGGER_ROLES.has(sourceLink.role)) continue;

    for (const targetLink of linksForContact(target)) {
      if (targetLink.contactId === sourceId) continue;
      const middle = contactsById.get(targetLink.contactId);
      if (!middle || middle.deletedAt) continue;

      const inferredRole = composeRelationship(sourceLink.role, targetLink.role);
      if (!inferredRole) continue;
      const hasExplicitMiddlePair =
        hasManualRelationship(sourceContact, targetLink.contactId) || hasManualRelationship(middle, sourceId);
      if (hasExplicitMiddlePair) continue;

      planRelationship(planned, {
        ownerId: sourceId,
        contactId: targetLink.contactId,
        relationship: relationshipLabel(inferredRole, middle),
        overwriteExisting: false,
        priority: INFERRED_RELATIONSHIP_PRIORITY,
        inferredFromContactId: sourceLink.contactId,
        inferenceDepth: 2,
      });
      planRelationship(planned, {
        ownerId: targetLink.contactId,
        contactId: sourceId,
        relationship: relationshipLabel(inverseRole(inferredRole), sourceContact),
        overwriteExisting: false,
        priority: INFERRED_RELATIONSHIP_PRIORITY,
        inferredFromContactId: sourceLink.contactId,
        inferenceDepth: 2,
      });

      for (const middleLink of linksForContact(middle)) {
        if (middleLink.contactId === sourceId || middleLink.contactId === sourceLink.contactId) continue;
        const far = contactsById.get(middleLink.contactId);
        if (!far || far.deletedAt) continue;

        const farRole = composeRelationship(inferredRole, middleLink.role);
        if (!farRole) continue;
        const hasExplicitFarPair =
          hasManualRelationship(sourceContact, middleLink.contactId) || hasManualRelationship(far, sourceId);
        if (hasExplicitFarPair) continue;

        planRelationship(planned, {
          ownerId: sourceId,
          contactId: middleLink.contactId,
          relationship: relationshipLabel(farRole, far),
          overwriteExisting: false,
          priority: INFERRED_RELATIONSHIP_PRIORITY,
          inferredFromContactId: sourceLink.contactId,
          inferenceDepth: 3,
        });
        planRelationship(planned, {
          ownerId: middleLink.contactId,
          contactId: sourceId,
          relationship: relationshipLabel(inverseRole(farRole), sourceContact),
          overwriteExisting: false,
          priority: INFERRED_RELATIONSHIP_PRIORITY,
          inferredFromContactId: sourceLink.contactId,
          inferenceDepth: 3,
        });
      }
    }
  }

  const updatesById = new Map<string, Contact>();
  for (const relationship of planned.values()) {
    const owner = updatesById.get(relationship.ownerId) ?? contactsById.get(relationship.ownerId);
    if (!owner || owner.deletedAt) continue;
    if (!relationship.overwriteExisting && hasManualRelationship(owner, relationship.contactId)) continue;
    updatesById.set(relationship.ownerId, setEmergencyRelationship(owner, relationship));
  }

  const updates = Array.from(updatesById.values());
  if (updates.length > 0) {
    await bulkSaveContacts(tenant, updates);
  }
}
