import type { Session, Teacher } from '@mms/shared';
import { DEFAULT_TEACHER_STATUS } from '@mms/shared';

export interface TeacherAssignedClassItem {
  sessionId: string;
  sessionName: string;
  sessionType?: string;
  sessionStatus?: string;
  classId: string;
  className: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
}

/** Resolves a teacher display name from the faculty registry. */
export function teacherNameById(teachers: Teacher[] | Map<string, Teacher>, id: string): string {
  if (!id) return '';
  if (teachers instanceof Map) return teachers.get(id)?.name ?? '';
  return teachers.find((teacher) => String(teacher.id) === id)?.name ?? '';
}

/** Persists only `teacherId` — display name is hydrated from the teachers registry. */
export function assignClassTeacher(teacherId: string): { teacherId: string } {
  return { teacherId: teacherId || '' };
}

/** Active faculty eligible for new class assignments. */
export function activeTeachersForAssignment(teachers: Teacher[]): Teacher[] {
  return teachers.filter((teacher) => teacher.status === DEFAULT_TEACHER_STATUS);
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

/** Extracts all classes assigned to a specific teacher from the sessions array. */
export function getTeacherAssignedClasses(teacherId: string | number, sessions: Session[]): TeacherAssignedClassItem[] {
  const list: TeacherAssignedClassItem[] = [];
  const teacherIdStr = String(teacherId);
  for (const session of sessions) {
    if (!session.classes || session.classes.length === 0) continue;
    for (const cls of session.classes) {
      if (String(cls.teacherId) === teacherIdStr) {
        list.push({
          sessionId: session.id,
          sessionName: session.name,
          sessionType: session.type,
          sessionStatus: session.status,
          classId: cls.id,
          className: cls.name,
          room: cls.room,
          capacity: cls.capacity,
          enrolled: cls.enrolled,
          gender: cls.gender,
          ageMin: cls.ageMin,
          ageMax: cls.ageMax,
        });
      }
    }
  }
  return list;
}

