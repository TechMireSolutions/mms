import { describe, expect, it } from 'vitest';
import {
  stripRecordFields,
  normalizeContactLinkedRecord,
  normalizeParentContactLinks,
  hydrateContactProfile,
  hydrateParentContactNames,
  resolveEntityName,
} from '../contactLinkPolicy.js';

describe('contactLinkPolicy', () => {
  describe('stripRecordFields', () => {
    it('removes specified profile fields from an object', () => {
      const input = { id: 1, name: 'John', phone: '+123', customData: { role: 'admin' } };
      const stripped = stripRecordFields(input, ['name', 'phone']);
      expect(stripped.id).toBe(1);
      expect(stripped).not.toHaveProperty('name');
      expect(stripped).not.toHaveProperty('phone');
    });
  });

  describe('normalizeContactLinkedRecord', () => {
    it('strips profile fields when contactId is present', () => {
      const record = { id: 's1', contactId: 'c1', name: 'Jane', phone: '+123' };
      const normalized = normalizeContactLinkedRecord(record);
      expect(normalized.id).toBe('s1');
      expect(normalized.contactId).toBe('c1');
      expect(normalized).not.toHaveProperty('name');
      expect(normalized).not.toHaveProperty('phone');
    });

    it('retains fields when contactId is missing', () => {
      const record = { id: 's1', name: 'Jane', phone: '+123' };
      const normalized = normalizeContactLinkedRecord(record);
      expect(normalized.name).toBe('Jane');
    });
  });

  describe('normalizeParentContactLinks', () => {
    it('strips denormalized parent names when parent contact IDs exist', () => {
      const record = {
        id: 'st1',
        fatherContactId: 'c_father',
        fatherName: 'Dad',
        motherContactId: 'c_mother',
        motherName: 'Mom',
      };
      const normalized = normalizeParentContactLinks(record);
      expect(normalized).not.toHaveProperty('fatherName');
      expect(normalized).not.toHaveProperty('motherName');
    });
  });

  describe('hydrateContactProfile & hydrateParentContactNames', () => {
    const contacts = [
      { id: 'c1', name: 'Jane Doe', gender: 'female', phones: [{ number: '+123456789' }] },
      { id: 'c_father', name: 'John Doe Sr.' },
    ];

    it('hydrates contact profile fields from contacts array', () => {
      const record: Record<string, unknown> = { id: 's1', contactId: 'c1' };
      const hydrated = hydrateContactProfile(record, contacts);
      expect(hydrated.name).toBe('Jane Doe');
      expect(hydrated.gender).toBe('female');
      expect(hydrated.phone).toBe('+123456789');
    });

    it('hydrates parent names from parent contact IDs', () => {
      const record: Record<string, unknown> = { id: 'st1', fatherContactId: 'c_father' };
      const hydrated = hydrateParentContactNames(record, contacts);
      expect(hydrated.fatherName).toBe('John Doe Sr.');
    });
  });

  describe('resolveEntityName', () => {
    it('resolves name by entity ID and returns empty string if not found', () => {
      const entities = [{ id: 'e1', name: 'Entity One' }];
      expect(resolveEntityName('e1', entities)).toBe('Entity One');
      expect(resolveEntityName('e2', entities)).toBe('');
      expect(resolveEntityName(null, entities)).toBe('');
    });
  });
});
