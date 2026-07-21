import { describe, expect, it } from 'vitest';
import { normalizeStoredTeacher, hydrateTeacherFromContact } from '../teacherUtils.js';
import type { Teacher } from '../teacherTypes.js';
import type { Contact } from '../contactTypes.js';

describe('teacherUtils', () => {
  describe('normalizeStoredTeacher', () => {
    it('strips contact-owned display fields from teacher record', () => {
      const rawTeacher = {
        id: 't-1',
        contactId: 'c-300',
        name: 'Ustad Tariq',
        email: 'tariq@madrasa.org',
        phone: '+923005554433',
        specialization: 'Hifz',
        status: 'active',
      };

      const normalized = normalizeStoredTeacher(rawTeacher);
      expect(normalized.id).toBe('t-1');
      expect(normalized.contactId).toBe('c-300');
      expect(normalized.specialization).toBe('Hifz');
      expect((normalized as any).name).toBeUndefined();
      expect((normalized as any).email).toBeUndefined();
      expect((normalized as any).phone).toBeUndefined();
    });
  });

  describe('hydrateTeacherFromContact', () => {
    const contacts: Contact[] = [
      {
        id: 'c-300',
        firstName: 'Tariq',
        lastName: 'Mahmood',
        name: 'Tariq Mahmood',
        emails: [{ label: 'Work', address: 'tariq@madrasa.org' }],
        phones: [{ label: 'Mobile', number: '3005554433', countryCode: '+92' }],
      },
    ];

    it('hydrates teacher display fields from linked contact profile', () => {
      const rawTeacher: Teacher = {
        id: 't-1',
        contactId: 'c-300',
        specialization: 'Tajweed',
        status: 'active',
      };

      const hydrated = hydrateTeacherFromContact(rawTeacher, contacts);
      expect(hydrated.name).toBe('Tariq Mahmood');
      expect(hydrated.email).toBe('tariq@madrasa.org');
      expect(hydrated.phone).toBe('3005554433');
      expect(hydrated.specialization).toBe('Tajweed');
    });
  });
});
