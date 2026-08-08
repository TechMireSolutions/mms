import { describe, expect, it } from 'vitest';
import { getTeacherFieldRemovalIssues } from './teacherFieldDependencies.js';

describe('getTeacherFieldRemovalIssues', () => {
  it('blocks deleting seed system fields', () => {
    const issues = getTeacherFieldRemovalIssues({
      fieldKey: 'specialization',
      columnRegistry: [],
    });
    expect(issues).toEqual([
      { area: 'systemField', messageKey: 'teachers.setup.cannotDeleteSystemField' },
    ]);
  });

  it('blocks deleting custom fields still enabled in column registry', () => {
    const issues = getTeacherFieldRemovalIssues({
      fieldKey: 'customNotes',
      columnRegistry: [{ key: 'custom:customNotes', label: 'Notes', enabled: true, order: 0 }],
    });
    expect(issues[0]?.messageKey).toBe('teachers.setup.fieldUsedInColumn');
  });

  it('allows deleting unused custom fields', () => {
    const issues = getTeacherFieldRemovalIssues({
      fieldKey: 'customNotes',
      columnRegistry: [{ key: 'status', label: 'Status', enabled: true, order: 0 }],
    });
    expect(issues).toEqual([]);
  });
});
