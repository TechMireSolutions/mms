import { type Student, todayISO } from "@mms/shared";

export function getInitialStudentDraft(student?: Partial<Student> | null): Partial<Student> {
  return {
    contactId: student?.contactId ?? "",
    fatherContactId: student?.fatherContactId ?? null,
    motherContactId: student?.motherContactId ?? null,
    guardianContactId: student?.guardianContactId ?? null,
    fatherName: student?.fatherName ?? "",
    motherName: student?.motherName ?? "",
    guardianName: student?.guardianName ?? "",
    status: student?.status ?? "active",
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? todayISO(),
    discountType: student?.discountType ?? "",
    discountPct: student?.discountPct ?? 0,
    registrationType: student?.registrationType ?? "",
    notes: student?.notes ?? "",
  };
}
