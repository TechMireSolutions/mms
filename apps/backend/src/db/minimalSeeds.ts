import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import {
  DEMO_STUDENTS,
  DEMO_STUDENT_CONTACTS_ALL,
  DEMO_TEACHER_CONTACTS,
  DEMO_TEACHERS,
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  WORKSPACES_COLLECTION,
} from '@mms/shared';

/**
 * Empty collections with default settings objects only — no massive mock data,
 * except `teachers` / `students` which ship small demo sets (contact-linked).
 */
export async function getMinimalCollectionsForSeed(): Promise<Record<string, unknown[]>> {
  const full = await getDefaultCollectionsForSeed();
  const minimal: Record<string, unknown[]> = {};
  for (const name of Object.keys(full)) {
    if (name === WORKSPACES_COLLECTION) continue;
    minimal[name] = [];
  }
  minimal.teachers = [...DEMO_TEACHERS];
  minimal.students = [...DEMO_STUDENTS];
  minimal.contacts = [...DEMO_TEACHER_CONTACTS, ...DEMO_STUDENT_CONTACTS_ALL];
  return minimal;
}

export function getMinimalObjects(): Record<string, unknown> {
  const objects = getDefaultObjects();
  return {
    ...objects,
    teachers_settings: objects.teachers_settings ?? DEFAULT_TEACHERS_SETTINGS,
    students_settings: objects.students_settings ?? DEFAULT_STUDENTS_SETTINGS,
  };
}
