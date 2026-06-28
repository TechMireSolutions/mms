import type { Teacher } from '@mms/shared';

/** Resolves a teacher display name from the faculty registry. */
export function teacherNameById(teachers: Teacher[], id: string): string {
  if (!id) return '';
  return teachers.find((teacher) => String(teacher.id) === id)?.name ?? '';
}

/** Persists only `teacherId` — display name is hydrated from the teachers registry. */
export function assignClassTeacher(teacherId: string): { teacherId: string } {
  return { teacherId: teacherId || '' };
}

/** Active faculty eligible for new class assignments. */
export function activeTeachersForAssignment(teachers: Teacher[]): Teacher[] {
  return teachers.filter((teacher) => teacher.status === 'active');
}

/** Options for class teacher select — active teachers plus the current assignee if inactive. */
export function teacherOptionsForClass(
  teachers: Teacher[],
  currentTeacherId?: string,
): Teacher[] {
  const active = activeTeachersForAssignment(teachers);
  if (!currentTeacherId || active.some((teacher) => String(teacher.id) === currentTeacherId)) {
    return active;
  }
  const currentTeacher = teachers.find((teacher) => String(teacher.id) === currentTeacherId);
  return currentTeacher ? [currentTeacher, ...active] : active;
}
