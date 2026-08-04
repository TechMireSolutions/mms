import type { Student } from "@mms/shared";

export function buildContactSelectPatch(
  id: string | number | null,
  student: Partial<Student> | null | undefined,
  studentDraft: Partial<Student>,
  nextGrNumber?: string,
): Partial<Student> | null {
  if (!id) {
    return { contactId: "" };
  }
  const patch: Partial<Student> = { contactId: String(id) };
  if (!student && !studentDraft.grNumber && nextGrNumber) {
    patch.grNumber = nextGrNumber;
  }
  return patch;
}
