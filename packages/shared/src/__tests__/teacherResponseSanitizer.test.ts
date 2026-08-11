import { describe, expect, it } from 'vitest';
import {
  sanitizeTeacherForViewer,
  sanitizeTeachersForViewer,
  type TeachersFieldConfigSnapshot,
} from '../teacherResponseSanitizer.js';
import type { Teacher } from '../teacherTypes.js';

describe('teacherResponseSanitizer', () => {
  const mockConfig: TeachersFieldConfigSnapshot = {
    tabs: [
      { key: 'basic', label: 'Profile', enabled: true, order: 1 },
      { key: 'employment', label: 'Employment', enabled: true, order: 2 },
    ],
    fields: {
      basic: [
        { key: 'qualification', type: 'text', label: 'Qualification', required: false, enabled: true, order: 1 },
      ],
      employment: [
        { key: 'joinDate', type: 'date', label: 'Join Date', required: false, enabled: true, order: 1 },
      ],
    },
  };

  const sampleTeacher: Teacher = {
    id: 't1',
    contactId: 'c1',
    name: 'Ada Lovelace',
    employeeId: 'TCH-1',
    status: 'active',
    qualification: 'Ijazah',
    joinDate: '2024-01-01',
    notes: 'Private',
  };

  describe('sanitizeTeacherForViewer', () => {
    it('preserves always-visible identity keys regardless of role', () => {
      const sanitized = sanitizeTeacherForViewer(sampleTeacher, 'viewer', mockConfig);
      expect(sanitized.id).toBe('t1');
      expect(sanitized.contactId).toBe('c1');
      expect(sanitized.name).toBe('Ada Lovelace');
      expect(sanitized.employeeId).toBe('TCH-1');
      expect(sanitized.status).toBe('active');
    });

    it('keeps fields authorized for the viewer role', () => {
      const sanitized = sanitizeTeacherForViewer(sampleTeacher, 'admin', mockConfig);
      expect(sanitized.qualification).toBe('Ijazah');
      expect(sanitized.joinDate).toBe('2024-01-01');
    });

    it('drops fields restricted by tab permissions', () => {
      const restrictedConfig: TeachersFieldConfigSnapshot = {
        ...mockConfig,
        tabs: [
          { key: 'basic', label: 'Profile', enabled: true, order: 1 },
          { key: 'employment', label: 'Employment', enabled: true, order: 2, permissions: ['admin'] },
        ],
      };
      const sanitized = sanitizeTeacherForViewer(sampleTeacher, 'viewer', restrictedConfig);
      expect(sanitized.joinDate).toBeUndefined();
      expect(sanitized.qualification).toBe('Ijazah');
    });

    it('drops fields restricted by field permissions', () => {
      const restrictedConfig: TeachersFieldConfigSnapshot = {
        ...mockConfig,
        fields: {
          ...mockConfig.fields,
          employment: [
            {
              key: 'joinDate',
              type: 'date',
              label: 'Join Date',
              required: false,
              enabled: true,
              order: 1,
              permissions: ['admin'],
            },
          ],
        },
      };
      const sanitized = sanitizeTeacherForViewer(sampleTeacher, 'viewer', restrictedConfig);
      expect(sanitized.joinDate).toBeUndefined();
      const admin = sanitizeTeacherForViewer(sampleTeacher, 'admin', restrictedConfig);
      expect(admin.joinDate).toBe('2024-01-01');
    });

    it('returns the teacher unchanged when the config has no tabbed field registry', () => {
      const sanitized = sanitizeTeacherForViewer(sampleTeacher, 'admin', {
        fields: { qualification: { enabled: true } } as never,
        tabs: [],
      });
      expect(sanitized).toEqual(sampleTeacher);
    });
  });

  describe('sanitizeTeachersForViewer', () => {
    it('batch sanitizes teachers for a viewer role', () => {
      const list = sanitizeTeachersForViewer([sampleTeacher], 'viewer', mockConfig);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('t1');
      // Unregistered keys survive (compat); only registered Setup fields are gated.
      expect(list[0].notes).toBe('Private');
    });
  });
});
