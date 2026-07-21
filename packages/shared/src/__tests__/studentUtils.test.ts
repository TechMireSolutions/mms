import { describe, expect, it } from 'vitest';
import { normalizeStoredStudent, hydrateStudentFromContacts } from '../studentUtils.js';
import type { Student } from '../studentTypes.js';
import type { Contact } from '../contactTypes.js';

describe('studentUtils', () => {
  describe('normalizeStoredStudent', () => {
    it('strips contact-owned display fields from student record', () => {
      const input = {
        id: 'student-1',
        contactId: 'contact-100',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+923001234567',
        fatherName: 'John Doe',
        fatherContactId: 'contact-200',
        grNumber: 'GR-001',
        status: 'active',
      };

      const normalized = normalizeStoredStudent(input);
      expect(normalized.id).toBe('student-1');
      expect(normalized.contactId).toBe('contact-100');
      expect(normalized.grNumber).toBe('GR-001');
      expect(normalized.status).toBe('active');
      expect((normalized as any).name).toBeUndefined();
      expect((normalized as any).email).toBeUndefined();
      expect((normalized as any).phone).toBeUndefined();
      expect((normalized as any).fatherName).toBeUndefined();
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
      },
      {
        id: 'c-father',
        firstName: 'Tariq',
        lastName: 'Ahmed',
        name: 'Tariq Ahmed',
        phones: [{ label: 'Mobile', number: '3009998877', countryCode: '+92' }],
      },
    ];

    it('hydrates student profile and father guardian details from linked contacts', () => {
      const rawStudent: Student = {
        id: 'st-1',
        contactId: 'c-1',
        fatherContactId: 'c-father',
        grNumber: 'GR-101',
        status: 'active',
      };

      const hydrated = hydrateStudentFromContacts(rawStudent, contacts);
      expect(hydrated.name).toBe('Fatima Ahmed');
      expect(hydrated.email).toBe('fatima@example.com');
      expect(hydrated.phone).toBe('3001112233');
      expect(hydrated.fatherName).toBe('Tariq Ahmed');
    });

    it('handles student without linked parent contacts gracefully', () => {
      const rawStudent: Student = {
        id: 'st-2',
        contactId: 'c-1',
        grNumber: 'GR-102',
        status: 'active',
      };

      const hydrated = hydrateStudentFromContacts(rawStudent, contacts);
      expect(hydrated.name).toBe('Fatima Ahmed');
      expect(hydrated.fatherName).toBeUndefined();
    });
  });
});
