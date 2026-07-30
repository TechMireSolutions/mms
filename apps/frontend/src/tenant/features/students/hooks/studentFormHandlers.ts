import type { Student } from "@mms/shared";
import type { Contact } from "@mms/shared";

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

export function buildParentSelectPatch(
  role: "father" | "mother" | "guardian",
  id: string | number | null,
  contactObj?: Contact | null,
): Partial<Student> {
  return {
    [`${role}ContactId`]: id ? String(id) : null,
    [`${role}Name`]: contactObj?.name ?? "",
  };
}
