/** Active employment status for a teacher profile. */
export const TEACHER_STATUS_VALUES = ['active', 'inactive', 'on_leave'] as const;
export type TeacherStatus = string;

/** Teaching specialization options for madrasa faculty. */
export const TEACHER_SPECIALIZATION_VALUES = [
  'Hifz',
  'Qaidah',
  'Tajweed',
  'Islamic Studies',
  'Arabic',
  'General',
  'Other',
] as const;
export type TeacherSpecialization = (typeof TEACHER_SPECIALIZATION_VALUES)[number];

/**
 * Faculty profile in the `teachers` collection.
 * Identity fields (`name`, `phone`, `email`, `gender`) live on the linked Contact and are hydrated for display.
 */
export interface Teacher {
  id: string;
  contactId: string | number;
  /** Hydrated from Contact — not persisted when `contactId` is set. */
  name?: string;
  employeeId?: string;
  phone?: string;
  email?: string;
  gender?: 'male' | 'female';
  specialization?: string;
  status: TeacherStatus;
  joinDate?: string;
  qualification?: string;
  notes?: string;
  userId?: string | null;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
}
