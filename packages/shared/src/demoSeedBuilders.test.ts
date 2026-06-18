import { describe, expect, it } from 'vitest';
import {
  DEMO_STUDENT_CONTACTS_ALL,
  DEMO_STUDENTS,
  DEMO_STUDENT_COUNT,
} from './demoStudents.js';
import {
  DEMO_TEACHER_CONTACTS,
  DEMO_TEACHERS,
  DEMO_TEACHER_COUNT,
} from './demoTeachers.js';

describe('demoSeedBuilders', () => {
  it('ships at least 100 students and 30 teachers with linked contacts', () => {
    expect(DEMO_STUDENTS).toHaveLength(DEMO_STUDENT_COUNT);
    expect(DEMO_STUDENTS.length).toBeGreaterThanOrEqual(100);
    expect(DEMO_STUDENT_CONTACTS_ALL.length).toBeGreaterThanOrEqual(DEMO_STUDENT_COUNT);

    expect(DEMO_TEACHERS).toHaveLength(DEMO_TEACHER_COUNT);
    expect(DEMO_TEACHERS.length).toBeGreaterThanOrEqual(30);
    expect(DEMO_TEACHER_CONTACTS).toHaveLength(DEMO_TEACHER_COUNT);

    for (const student of DEMO_STUDENTS) {
      expect(student.contactId).toBeTruthy();
      expect(student.grNumber).toMatch(/^\d{4}-\d{4}$/);
    }

    for (const teacher of DEMO_TEACHERS) {
      expect(teacher.contactId).toBeTruthy();
      expect(teacher.employeeId).toMatch(/^TCH-\d{4}$/);
    }
  });
});
