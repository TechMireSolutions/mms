import { getPrimaryPhone, hasWhatsApp, type Student } from "@mms/shared";

export interface StudentsSelectionTargets {
  waTargets: Student[];
  smsReady: Student[];
  emailReady: Student[];
}

/** Pure eligibility for bulk messaging from current-page rows ∩ selected ids. */
export function computeStudentsSelectionTargets({
  selectedIds,
  workStudents,
}: {
  selectedIds: string[];
  workStudents: Student[];
}): StudentsSelectionTargets {
  if (selectedIds.length === 0) {
    return { waTargets: [], smsReady: [], emailReady: [] };
  }

  const selectedSet = new Set(selectedIds);
  const waTargets: Student[] = [];
  const smsReady: Student[] = [];
  const emailReady: Student[] = [];

  for (const student of workStudents) {
    if (!selectedSet.has(String(student.id))) continue;
    if (hasWhatsApp({ phone: student.phone })) waTargets.push(student);
    if (getPrimaryPhone({ phone: student.phone })) smsReady.push(student);
    if (student.email?.trim()) emailReady.push(student);
  }

  return { waTargets, smsReady, emailReady };
}
