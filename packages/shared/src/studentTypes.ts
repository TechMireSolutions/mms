/** Active enrollment status for a student profile. */
export const STUDENT_STATUS_VALUES = ['active', 'inactive', 'suspended'] as const;
export type StudentStatus = (typeof STUDENT_STATUS_VALUES)[number];

/**
 * Student profile in the `students` collection.
 * Identity fields are hydrated from linked contacts — not persisted when contact ids are set.
 */
export interface Student {
  id: string;
  contactId: string | number;
  /** Hydrated from student Contact. */
  name?: string;
  gender?: 'male' | 'female';
  dob?: string;
  phone?: string;
  email?: string;
  city?: string;
  fatherContactId?: string | number | null;
  motherContactId?: string | number | null;
  /** Other guardian (uncle, sibling, etc.) when not father/mother. */
  guardianContactId?: string | number | null;
  /** Hydrated from father Contact. */
  fatherName?: string;
  /** Hydrated from mother Contact. */
  motherName?: string;
  /** Hydrated from guardian Contact. */
  guardianName?: string;
  cnic?: string;
  grNumber?: string;
  status?: StudentStatus;
  registeredDate?: string;
  enrollmentDate?: string;
  enrolledSessions?: string[];
  discountType?: string;
  discountPct?: number;
  registrationType?: string;
  notes?: string;
  [key: string]: unknown;
}
