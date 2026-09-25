import { notify } from "@/lib/notify";
import {
  type TeachersSettings,
  type Teacher,
  type TeacherDuplicateReason,
  type Contact,
  type ValidationError,
  type FieldDefinition,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  checkTeacherFormDuplicate,
  DUPLICATE_ERROR_KEYS,
  focusTeacherValidationField,
  teacherValidationErrorsByField,
  validateTeacherDraft,
} from "@/tenant/features/faculty/components/facultyFormValidation";
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";
import {
  confirmPendingTeacherSave,
  notifyTeacherSaveFailed,
  syncUserAccount,
} from "@/tenant/features/faculty/components/facultyFormUserSync";
import {
  buildTeacherSavePayload,
  validateUserDraftRequirements,
  isEmployeeIdConflictError,
} from "@/tenant/features/faculty/components/facultyFormSavePayload";

export { focusTeacherValidationField, confirmPendingTeacherSave };

export interface TeacherSaveFlowInput {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
  formInstanceId: string;
  linkedContact?: Contact | null;
  settings: TeachersSettings;
  enabledTabs: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  language: string;
  t: TranslationFunction;
  onSave: (teacher: Teacher) => void | Promise<void>;
  onClose: () => void;
  keepOpen?: boolean;
  onBaselineReset?: (payload: Partial<Teacher>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSaving: (saving: boolean) => void;
  setPendingSaveData: (data: Partial<Teacher> | null) => void;
  setTypedDuplicateReason: (reason: TeacherDuplicateReason | null) => void;
  setDuplicateConfirmOpen: (open: boolean) => void;
  userAccountDraft?: FacultyUserAccountDraft;
  linkedUser?: { id: string; role?: string } | null;
  onUserInvalidate?: () => void;
}


/** Validate + persist teacher form draft; surfaces field errors and toasts on failure. */
export async function runTeacherSaveFlow(input: TeacherSaveFlowInput): Promise<boolean> {
  input.setErrors({});
  const payload = buildTeacherSavePayload(input);

  const validationErrors: ValidationError[] | null = validateTeacherDraft(payload as Record<string, unknown>, {
    settings: input.settings,
    enabledTabs: input.enabledTabs,
    fields: input.fields,
    language: input.language,
  });
  if (validationErrors) {
    input.setErrors(teacherValidationErrorsByField(validationErrors));
    const firstField = validationErrors[0]?.fieldId;
    if (firstField) focusTeacherValidationField(input.formInstanceId, firstField);
    notify.error(input.t("common.formPleaseFixErrors"));
    return false;
  }

  const allowedDesignationRoles = input.teacherDraft.designationAssignableRoles;
  if (
    input.userAccountDraft?.enabled
    && input.teacherDraft.designationId
    && !(allowedDesignationRoles ?? []).includes(input.userAccountDraft.role)
  ) {
    input.setErrors({ "user.role": input.t("faculty.designations.roleNotAllowed") });
    notify.error(input.t("faculty.designations.roleNotAllowed"));
    return false;
  }

  if (!validateUserDraftRequirements(input)) return false;

  input.setSaving(true);
  try {
    const duplicateReason = await checkTeacherFormDuplicate({
      teacherId: input.teacher?.id ? String(input.teacher.id) : undefined,
      contactId: String(input.teacherDraft.contactId || ""),
      linkedContact: input.linkedContact,
      employeeId: typeof payload.employeeId === "string" ? payload.employeeId : undefined,
    });

    if (duplicateReason === "employeeId") {
      input.setErrors({ employeeId: input.t(DUPLICATE_ERROR_KEYS.employeeId) });
      focusTeacherValidationField(input.formInstanceId, "employeeId");
      notify.error(input.t(DUPLICATE_ERROR_KEYS.employeeId));
      return false;
    }

    if (duplicateReason) {
      input.setPendingSaveData(payload);
      input.setTypedDuplicateReason(duplicateReason);
      input.setDuplicateConfirmOpen(true);
      return false;
    }

    const userOk = await syncUserAccount({
      userAccountDraft: input.userAccountDraft,
      linkedUser: input.linkedUser,
      contactId: payload.contactId,
      payload: payload as Record<string, unknown>,
      t: input.t,
      setErrors: input.setErrors,
      onUserInvalidate: input.onUserInvalidate,
    });
    if (!userOk) return false;

    await input.onSave(payload as Teacher);
    input.onBaselineReset?.(payload);
    if (!input.keepOpen) input.onClose();
    return true;
  } catch (err: unknown) {
    if (isEmployeeIdConflictError(err)) {
      input.setErrors({ employeeId: input.t(DUPLICATE_ERROR_KEYS.employeeId) });
      focusTeacherValidationField(input.formInstanceId, "employeeId");
      notify.error(input.t(DUPLICATE_ERROR_KEYS.employeeId));
      return false;
    }

    notifyTeacherSaveFailed(input.t, err, "teachers.form_save");
    return false;
  } finally {
    input.setSaving(false);
  }
}
