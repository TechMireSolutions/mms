import { describe, expect, it } from 'vitest';
import { buildDynamicStudentSchema, formatStudentZodIssues } from '../studentValidation.js';
import type { StudentsSettings } from '../settingsTypes.js';
import type { FieldDefinition } from '../contactTypes.js';

describe('studentValidation', () => {
  const mockSettings: StudentsSettings = {
    requireGuardian: true,
    autoGenerateGrNumber: false,
    grNumberPrefix: 'GR',
    formTabs: [
      { key: 'basic', label: 'Basic Info', enabled: true, order: 1 },
      { key: 'guardian', label: 'Guardian Info', enabled: true, order: 2 },
    ],
  };

  const mockEnabledTabIds = new Set(['basic', 'guardian']);
  const mockRequiredTabIds = new Set(['basic']);

  const mockFields: Record<string, FieldDefinition[]> = {
    basic: [
      { key: 'category', label: 'Category', type: 'select', enabled: true, required: false, order: 1 },
    ],
    guardian: [
      { key: 'fatherLink', label: 'Father Link', type: 'text', enabled: true, required: false, order: 1 },
      { key: 'motherLink', label: 'Mother Link', type: 'text', enabled: true, required: false, order: 2 },
      { key: 'guardianLink', label: 'Guardian Link', type: 'text', enabled: true, required: false, order: 3 },
    ],
  };

  it('validates a correct student payload with father guardian linked', () => {
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
    }
  });

  it('fails validation when requireGuardian is enabled and no guardian is linked', () => {
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
      expect(formatted.some((err) => err.message.includes('guardian'))).toBe(true);
    }
  });
});
