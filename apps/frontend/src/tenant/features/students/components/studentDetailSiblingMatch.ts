import type { Session, Student } from "@mms/shared";
import type { DerivedStudentGuardianLinks } from "@mms/shared";
import type { SiblingStudentItem } from "@/tenant/features/students/components/StudentDetailSiblingsSection";

/**
 * Sibling candidates: other students sharing the same father contact, guardian contact,
 * or normalized father name, enriched with their enrolled session names.
 */
export function buildStudentSiblings(
  student: Student,
  guardians: DerivedStudentGuardianLinks,
  allStudents: Student[],
  sessions: Session[],
): SiblingStudentItem[] {
  if (!student.id) return [];
  const fatherId = guardians.fatherContactId ? String(guardians.fatherContactId) : null;
  const guardianId = guardians.guardianContactId ? String(guardians.guardianContactId) : null;
  const fatherName = (guardians.fatherName || student.fatherName || "").trim().toLowerCase();

  if (!fatherId && !guardianId && !fatherName) return [];

  const matched: SiblingStudentItem[] = [];

  for (const other of allStudents) {
    if (String(other.id) === String(student.id)) continue;
    const otherFatherId = other.fatherContactId ? String(other.fatherContactId) : null;
    const otherGuardianId = other.guardianContactId ? String(other.guardianContactId) : null;
    const otherFatherName = (other.fatherName || "").trim().toLowerCase();

    const isMatch =
      (fatherId && otherFatherId && fatherId === otherFatherId) ||
      (guardianId && otherGuardianId && guardianId === otherGuardianId) ||
      (fatherName && otherFatherName && fatherName === otherFatherName);

    if (isMatch) {
      const sessionNames = sessions
        .filter((sess) => other.enrolledSessions?.includes(sess.id))
        .map((sess) => sess.name);

      matched.push({
        id: String(other.id),
        name: other.name || "",
        grNumber: other.grNumber,
        status: other.status,
        gender: other.gender,
        sessionNames,
      });
    }
  }

  return matched;
}