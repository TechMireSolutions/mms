import { type Contact, type ContactRelationship, type EmergencyContact, type RelationshipPair } from '@mms/shared';
import { bulkSaveContacts, findContactsByIds } from '../db/repositories/contactRepository.js';
import { loadContactPreferences } from './contactPreferencesService.js';

import {
  DIRECT_RELATIONSHIP_PRIORITY,
  INFERRED_RELATIONSHIP_PRIORITY,
  PRIMARY_TRIGGER_ROLES,
  composeRelationship,
  inverseRole,
  relationshipLabel,
  relationshipRole,
  resolveInverseRelationship,
  type PlannedRelationship,
  type RelationshipLink,
} from './contactRelationshipRules.js';


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

export async function applyContactRelationshipInference(
  tenant: string,
  sourceContact: Contact,
  customPairs?: RelationshipPair[],
): Promise<void> {
  const sourceId = String(sourceContact.id);
  const sourceLinks = linksForContact(sourceContact).filter((entry) => entry.contactId !== sourceId);
  if (sourceLinks.length === 0) return;

  const resolvedPairs = customPairs ?? (await loadContactPreferences())?.relationshipPairs;

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

    const reciprocalLabel = resolveInverseRelationship(
      sourceLink.relationship ?? '',
      sourceContact,
      resolvedPairs,
    );

    planRelationship(planned, {
      ownerId: sourceLink.contactId,
      contactId: sourceId,
      relationship: reciprocalLabel,
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
