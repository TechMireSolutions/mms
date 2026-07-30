import { notify } from "@/lib/notify";
import type { Student, ValidationError, StudentDuplicateReason } from "@mms/shared";
import type { Contact } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  validateStudentDraft,
  checkStudentFormDuplicate,
  prepareStudentForSave,
  type StudentValidationContext,
} from "./studentFormValidation";

export interface StudentSaveFlowInput {
  studentDraft: Partial<Student>;
  student?: Partial<Student> | null;
  linkedContact?: Contact | null;
  linkedGenderRaw: string;
  validationContext: Omit<StudentValidationContext, "linkedGenderRaw" | "linkedDob">;
  blueprintVersion?: string | number | null;
  t: TranslationFunction;
  onSave: (student: Student) => void | Promise<void>;
  onClose: () => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setSaving: (saving: boolean) => void;
  setPendingSaveData: (data: Partial<Student> | null) => void;
  setTypedDuplicateReason: (reason: StudentDuplicateReason | null) => void;
  setDuplicateConfirmOpen: (open: boolean) => void;
}

export async function runStudentSaveFlow(input: StudentSaveFlowInput): Promise<void> {
  input.setValidationErrors([]);

  const zodErrors = validateStudentDraft(input.studentDraft, {
    ...input.validationContext,
    linkedGenderRaw: input.linkedGenderRaw,
    linkedDob: input.linkedContact?.dob || "",
  });
  if (zodErrors) {
    input.setValidationErrors(zodErrors);
    notify.error(input.t("common.formPleaseFixErrors"));
    return;
  }

  input.setSaving(true);
  try {
    const duplicateReason = await checkStudentFormDuplicate({
      studentId: input.student?.id ? String(input.student.id) : undefined,
      contactId: String(input.studentDraft.contactId),
      linkedContact: input.linkedContact,
    });

    if (duplicateReason) {
      input.setPendingSaveData(input.studentDraft);
      input.setTypedDuplicateReason(duplicateReason);
      input.setDuplicateConfirmOpen(true);
      input.setSaving(false);
      return;
    }

    await commitStudentSave({
      data: input.studentDraft,
      student: input.student,
      blueprintVersion: input.blueprintVersion,
      onSave: input.onSave,
    });
    input.onClose();
  } catch (err: unknown) {
    notify.error(input.t("settings.serverSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
  } finally {
    input.setSaving(false);
  }
}

export async function confirmPendingStudentSave(input: {
  pendingSaveData: Partial<Student> | null;
  student?: Partial<Student> | null;
  blueprintVersion?: string | number | null;
  t: TranslationFunction;
  onSave: (student: Student) => void | Promise<void>;
  onClose: () => void;
  setSaving: (saving: boolean) => void;
  setPendingSaveData: (data: Partial<Student> | null) => void;
  setDuplicateConfirmOpen: (open: boolean) => void;
}): Promise<void> {
  if (!input.pendingSaveData) return;
  input.setSaving(true);
  try {
    await commitStudentSave({
      data: input.pendingSaveData,
      student: input.student,
      blueprintVersion: input.blueprintVersion,
      onSave: input.onSave,
    });
    input.setPendingSaveData(null);
    input.setDuplicateConfirmOpen(false);
    input.onClose();
  } catch (err: unknown) {
    notify.error(input.t("settings.serverSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
  } finally {
    input.setSaving(false);
  }
}

async function commitStudentSave(input: {
  data: Partial<Student>;
  student?: Partial<Student> | null;
  blueprintVersion?: string | number | null;
  onSave: (student: Student) => void | Promise<void>;
}): Promise<void> {
  await input.onSave(
    prepareStudentForSave({
      data: input.data,
      studentId: input.student?.id,
      enrolledSessions: input.student?.enrolledSessions,
      blueprintVersion: input.blueprintVersion,
    }),
  );
}
