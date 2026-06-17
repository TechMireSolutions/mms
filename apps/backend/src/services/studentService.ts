import { fetchCollection, persistCollection } from './dbSyncService.js';
import {
  studentListSchema,
  type StudentRecord,
} from '../validation/studentSchemas.js';

export async function loadStudents(): Promise<StudentRecord[]> {
  const data = await fetchCollection('students');
  const parsed = studentListSchema.safeParse(data ?? []);
  return parsed.success ? parsed.data : [];
}

export async function createStudent(record: StudentRecord): Promise<StudentRecord> {
  const students = await loadStudents();
  students.push(record);
  await persistCollection('students', students);
  return record;
}

export async function updateStudentById(
  id: string,
  record: StudentRecord,
): Promise<StudentRecord | null> {
  const students = await loadStudents();
  const index = students.findIndex((s) => String(s.id) === id);
  if (index < 0) return null;
  const updated = { ...record, id: record.id ?? id };
  students[index] = updated;
  await persistCollection('students', students);
  return updated;
}

export async function deleteStudentById(id: string): Promise<boolean> {
  const students = await loadStudents();
  const next = students.filter((s) => String(s.id) !== id);
  if (next.length === students.length) return false;
  await persistCollection('students', next);
  return true;
}
