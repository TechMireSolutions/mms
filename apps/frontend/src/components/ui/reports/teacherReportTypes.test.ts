import { describe, expect, it } from 'vitest';
import { mapTeacherRow } from './teacherReportTypes';

describe('mapTeacherRow', () => {
  it('maps a hydrated teacher to the roster row shape', () => {
    const row = mapTeacherRow({
      id: 't1',
      contactId: 99,
      name: 'Maulana Ahmed',
      employeeId: 'EMP-004',
      specialization: 'Hifz',
      status: 'active',
      qualification: 'Alim',
      joinDate: '2024-01-15',
      gender: 'male',
    });
    expect(row.id).toBe('t1');
    expect(row.name).toBe('Maulana Ahmed');
    expect(row.employeeId).toBe('EMP-004');
    expect(row.specialization).toBe('Hifz');
    expect(row.status).toBe('active');
    expect(row.qualification).toBe('Alim');
    expect(row.gender).toBe('male');
    expect(row.joinDate).toContain('15');
    expect(row.joinDate).toContain('2024');
  });

  it('falls back to defaults for missing optional fields', () => {
    const row = mapTeacherRow({ id: 't2', contactId: 'c1' } as never);
    expect(row.name).toBe('');
    expect(row.employeeId).toBe('—');
    expect(row.specialization).toBe('—');
    expect(row.status).toBe('inactive');
    expect(row.qualification).toBe('—');
    expect(row.joinDate).toBe('—');
    expect(row.gender).toBe('—');
  });

  it('omits the join date column when absent', () => {
    const row = mapTeacherRow({
      id: 't3',
      contactId: 1,
      name: 'Ustadha Fatima',
      status: 'on_leave',
    });
    expect(row.joinDate).toBe('—');
  });
});
