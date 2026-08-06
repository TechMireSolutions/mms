import { describe, expect, it } from 'vitest';
import { normalizeStoredStudent, hydrateStudentFromContacts } from '../studentUtils.js';
import { studentRecordSchema } from '../studentsModuleManifest.js';
import type { Student } from '../studentTypes.js';
import type { Contact } from '../contactTypes.js';

describe('studentUtils', () => {
  describe('normalizeStoredStudent', () => {
    it('strips contact-owned display fields and guardian link fields from student record', () => {
      const input = {
        id: 'student-1',
        contactId: 'contact-100',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+923001234567',
        fatherName: 'John Doe',
        fatherContactId: 'contact-200',
        motherContactId: 'contact-201',
        guardianContactId: 'contact-202',
        motherName: 'Jane Sr',
        guardianName: 'Uncle',
        grNumber: 'GR-001',
        status: 'active',
      };

      const normalized = normalizeStoredStudent(input);
      expect(normalized.id).toBe('student-1');
      expect(normalized.contactId).toBe('contact-100');
      expect(normalized.grNumber).toBe('GR-001');
      expect(normalized.status).toBe('active');
      expect((normalized as { name?: string }).name).toBeUndefined();
      expect((normalized as { email?: string }).email).toBeUndefined();
      expect((normalized as { phone?: string }).phone).toBeUndefined();
      expect((normalized as { fatherName?: string }).fatherName).toBeUndefined();
      expect((normalized as { fatherContactId?: string }).fatherContactId).toBeUndefined();
      expect((normalized as { motherContactId?: string }).motherContactId).toBeUndefined();
      expect((normalized as { guardianContactId?: string }).guardianContactId).toBeUndefined();
      expect((normalized as { motherName?: string }).motherName).toBeUndefined();
      expect((normalized as { guardianName?: string }).guardianName).toBeUndefined();
    });

    it('strips client soft-delete metadata from student record', () => {
      const input = {
        id: 'student-2',
        contactId: 'contact-100',
        grNumber: 'GR-002',
        status: 'active',
        deletedAt: '2026-01-01T00:00:00.000Z',
        deleted: true,
        deletedBy: 'u-evil',
        deletionReason: 'should not persist',
      };

      const normalized = normalizeStoredStudent(input);
      expect(normalized.id).toBe('student-2');
      expect((normalized as { deletedAt?: string }).deletedAt).toBeUndefined();
      expect((normalized as { deleted?: boolean }).deleted).toBeUndefined();
      expect((normalized as { deletedBy?: string }).deletedBy).toBeUndefined();
      expect((normalized as { deletionReason?: string }).deletionReason).toBeUndefined();
    });
  });

  describe('studentRecordSchema', () => {
    it('drops client soft-delete keys on parse while keeping Setup customs', () => {
      const parsed = studentRecordSchema.parse({
        id: 'student-3',
        contactId: 'contact-100',
        grNumber: 'GR-003',
        status: 'active',
        deletedAt: '2026-01-01T00:00:00.000Z',
        deleted: true,
        deletedBy: 'u-evil',
        deletionReason: 'client wipe',
        customHouse: 'Green',
      }) as Record<string, unknown>;

      expect(parsed.id).toBe('student-3');
      expect(parsed.grNumber).toBe('GR-003');
      expect(parsed.customHouse).toBe('Green');
      expect(parsed.deletedAt).toBeUndefined();
      expect(parsed.deleted).toBeUndefined();
      expect(parsed.deletedBy).toBeUndefined();
      expect(parsed.deletionReason).toBeUndefined();
    });
  });

  describe('hydrateStudentFromContacts', () => {
    const contacts: Contact[] = [
      {
        id: 'c-1',
        firstName: 'Fatima',
        lastName: 'Ahmed',
        name: 'Fatima Ahmed',
        emails: [{ label: 'Personal', address: 'fatima@example.com' }],
        phones: [{ label: 'Mobile', number: '3001112233', countryCode: '+92' }],
        relationshipContacts: [
          { contactId: 'c-father', relationship: 'Parent', name: 'Tariq Ahmed' },
        ],
      },
      {
        id: 'c-father',
        firstName: 'Tariq',
        lastName: 'Ahmed',
        name: 'Tariq Ahmed',
        phones: [{ label: 'Mobile', number: '3009998877', countryCode: '+92' }],
      },
    ];

    it('hydrates student profile and father from contact relationships', () => {
      const rawStudent: Student = {
        id: 'st-1',
        contactId: 'c-1',
        grNumber: 'GR-101',
        status: 'active',
      };

      const hydrated = hydrateStudentFromContacts(rawStudent, contacts);
      expect(hydrated.name).toBe('Fatima Ahmed');
      expect(hydrated.email).toBe('fatima@example.com');
      expect(hydrated.phone).toBe('3001112233');
      expect(hydrated.fatherContactId).toBe('c-father');
      expect(hydrated.fatherName).toBe('Tariq Ahmed');
    });

    it('falls back to legacy student fatherContactId when relationships omit father', () => {
      const rawStudent: Student = {
        id: 'st-1b',
        contactId: 'c-1',
        fatherContactId: 'c-father',
        grNumber: 'GR-101b',
        status: 'active',
      };
      const primaryWithoutFather: Contact = {
        ...contacts[0]!,
        relationshipContacts: [],
      };

      const hydrated = hydrateStudentFromContacts(rawStudent, [primaryWithoutFather, contacts[1]!]);
      expect(hydrated.fatherContactId).toBe('c-father');
      expect(hydrated.fatherName).toBe('Tariq Ahmed');
    });

    it('handles student without linked parent contacts gracefully', () => {
      const rawStudent: Student = {
        id: 'st-2',
        contactId: 'c-1',
        grNumber: 'GR-102',
        status: 'active',
      };
      const primaryAlone: Contact = {
        id: 'c-1',
        firstName: 'Fatima',
        lastName: 'Ahmed',
        name: 'Fatima Ahmed',
        emails: [{ label: 'Personal', address: 'fatima@example.com' }],
        phones: [{ label: 'Mobile', number: '3001112233', countryCode: '+92' }],
      };

      const hydrated = hydrateStudentFromContacts(rawStudent, [primaryAlone]);
      expect(hydrated.name).toBe('Fatima Ahmed');
      expect(hydrated.fatherName).toBeUndefined();
    });
  });
});
