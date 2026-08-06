import { describe, expect, it } from 'vitest';
import { buildDynamicStudentSchema, formatStudentZodIssues } from '../studentValidation.js';
import { DEFAULT_STUDENTS_SETTINGS, type StudentsSettings } from '../settingsTypes.js';
import type { FieldDefinition } from '../contactTypes.js';

describe('studentValidation', () => {
  const mockSettings: StudentsSettings = {
    ...DEFAULT_STUDENTS_SETTINGS,
    requireGuardian: true,
    formTabs: [
      { key: 'basic', label: 'Identity', enabled: true, order: 0 },
      { key: 'registration', label: 'Registration', enabled: true, order: 1 },
    ],
  };

  const mockEnabledTabIds = new Set(['basic', 'registration']);
  const mockRequiredTabIds = new Set(['basic']);

  const mockFields: Record<string, FieldDefinition[]> = {
    basic: [
      { key: 'category', label: 'Category', type: 'select', enabled: true, required: false, order: 1 },
      {
        key: 'contactRelationships',
        label: 'Relationships',
        type: 'text',
        enabled: true,
        required: false,
        order: 2,
      },
    ],
    registration: [
      { key: 'registeredDate', label: 'Registration Date', type: 'date', enabled: true, required: false, order: 0 },
    ],
  };

  it('validates a correct student payload with parent guardian linked', () => {
    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      mockFields,
    );

    const validPayload = {
      contactId: 'c-100',
      grNumber: 'GR-1234',
      status: 'active',
      fatherContactId: 'c-200',
    };

    const result = schema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails validation when required contactId is missing', () => {
    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      mockFields,
    );

    const invalidPayload = {
      contactId: '',
      grNumber: 'GR-1234',
      status: 'active',
      fatherContactId: 'c-200',
    };

    const result = schema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatStudentZodIssues(result.error, invalidPayload, mockFields);
      expect(formatted.some((err) => err.fieldId === 'contactId')).toBe(true);
      expect(formatted.find((err) => err.fieldId === 'contactId')?.tabId).toBe('basic');
    }
  });

  it('fails validation when requireGuardian is enabled and no Parent/Guardian is linked', () => {
    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      mockFields,
    );

    const missingGuardianPayload = {
      contactId: 'c-100',
      grNumber: 'GR-1234',
      status: 'active',
    };

    const result = schema.safeParse(missingGuardianPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatStudentZodIssues(result.error, missingGuardianPayload, mockFields);
      expect(formatted.some((err) => err.fieldId === 'contactRelationships')).toBe(true);
      expect(formatted.find((err) => err.fieldId === 'contactRelationships')?.tabId).toBe('basic');
    }
  });

  it('passes requireGuardian when primary contact has a Parent relationship link', () => {
    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      mockFields,
      'en',
      undefined,
      {
        relationshipContacts: [{ contactId: 'c-parent', relationship: 'Parent', name: 'Abu' }],
      },
    );

    const result = schema.safeParse({
      contactId: 'c-100',
      grNumber: 'GR-1234',
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('passes requireGuardian when only hydrated fatherName slot is present', () => {
    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      mockFields,
    );

    const result = schema.safeParse({
      contactId: 'c-100',
      grNumber: 'GR-1234',
      status: 'active',
      fatherName: 'Legacy Parent',
    });
    expect(result.success).toBe(true);
  });

  it('maps registration field errors to the registration form tab', () => {
    const fieldsWithRequiredCustom: Record<string, FieldDefinition[]> = {
      ...mockFields,
      registration: [
        ...mockFields.registration,
        {
          key: 'scholarshipNote',
          label: 'Scholarship',
          type: 'text',
          enabled: true,
          required: true,
          order: 1,
        },
      ],
    };

    const schema = buildDynamicStudentSchema(
      mockSettings,
      mockEnabledTabIds,
      mockRequiredTabIds,
      fieldsWithRequiredCustom,
    );

    const payload = {
      contactId: 'c-100',
      grNumber: 'GR-1234',
      status: 'active',
      fatherContactId: 'c-200',
    };

    const result = schema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatStudentZodIssues(result.error, payload, fieldsWithRequiredCustom);
      expect(formatted.find((err) => err.fieldId === 'scholarshipNote')?.tabId).toBe('registration');
    }
  });
});
