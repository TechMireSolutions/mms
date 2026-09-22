import { notify } from "@/lib/notify";
import { apiContract } from "@/lib/api";
import {
  type TeachersSettings,
  type Teacher,
  type TeacherDuplicateReason,
  type Contact,
  type ValidationError,
  type FieldDefinition,
  getPrimaryEmail,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";
import { reportClientError } from "@/lib/clientErrorReporting";
import { scrollAndFocusFirstError } from "@/lib/forms/formAutoScroll";
import {
  checkTeacherFormDuplicate,
  DUPLICATE_ERROR_KEYS,
  teacherValidationErrorsByField,
  validateTeacherDraft,
} from "@/tenant/features/faculty/components/facultyFormValidation";
import { extractEmployeeId } from "@/tenant/features/faculty/components/facultyFormDraft";
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

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

/** Focus the first invalid teacher form field with smooth auto-scroll. */
function focusTeacherValidationField(formInstanceId: string, fieldId: string): void {
  const candidates = [
    `tf-${formInstanceId}-${fieldId}`,
    fieldId,
    fieldId === "contactId" ? "contactId" : "",
  ].filter(Boolean);

  scrollAndFocusFirstError(candidates, { behavior: "smooth", block: "center" });
}

/** Build the save payload (resolved employeeId + typed contactId) from the draft. */
function buildTeacherSavePayload(input: {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
}): Record<string, unknown> {
  const rawEmployeeId = extractEmployeeId(input.teacherDraft.employeeId);
  const rawNextEmployeeId = extractEmployeeId(input.nextEmployeeId);
  const resolvedEmployeeId = rawEmployeeId || (input.autoGenerateId && !input.teacher?.id ? rawNextEmployeeId : undefined);

  return {
    ...input.teacherDraft,
    employeeId: resolvedEmployeeId,
    contactId: String(input.teacherDraft.contactId || ""),
    ...(input.teacher?.id != null ? { id: input.teacher.id } : {}),
  };
}

function notifyTeacherSaveFailed(t: TranslationFunction, err: unknown, scope: string): void {
  const validationMessage = getApiValidationMessage(err);
  notify.error(
    t("teachers.toast.saveFailed"),
    validationMessage ? { description: validationMessage } : undefined,
  );
  reportClientError(err, { scope });
}

/** Synchronize linked user account or create a new user with chosen workspace role. */
async function syncUserAccount(input: {
  userAccountDraft?: FacultyUserAccountDraft;
  linkedUser?: { id: string; role?: string } | null;
  contactId?: string | number;
  payload: Record<string, unknown>;
  t: TranslationFunction;
  setErrors: (errors: Record<string, string>) => void;
  onUserInvalidate?: () => void;
}): Promise<boolean> {
  const { userAccountDraft, linkedUser, contactId, payload, t, setErrors, onUserInvalidate } = input;

  if (linkedUser) {
    payload.userId = linkedUser.id;
    if (userAccountDraft?.enabled && userAccountDraft.role && userAccountDraft.role !== linkedUser.role) {
      const updateRes = await apiContract.users.update({
        params: { id: linkedUser.id },
        body: { role: userAccountDraft.role },
      });
      if (updateRes.status !== 200) {
        const msg = typeof updateRes.body === "object" && updateRes.body !== null && "message" in updateRes.body
          ? String((updateRes.body as { message?: unknown }).message)
          : t("teachers.toast.saveFailed");
        setErrors({ "user.role": msg });
        notify.error(msg);
        return false;
      }
      onUserInvalidate?.();
    }
    return true;
  }

  if (userAccountDraft?.enabled) {
    const createRes = await apiContract.users.create({
      body: {
        contactId: String(contactId || ""),
        role: userAccountDraft.role || "teacher",
        status: userAccountDraft.setupMethod === "invite" ? "inactive" : "active",
        setupMethod: userAccountDraft.setupMethod,
        password: userAccountDraft.password,
        forceReset: userAccountDraft.forceReset !== false,
        twoFactorEnabled: false,
      },
    });

    if (createRes.status !== 200) {
      const msg = typeof createRes.body === "object" && createRes.body !== null && "message" in createRes.body
        ? String((createRes.body as { message?: unknown }).message)
        : t("teachers.toast.saveFailed");
      setErrors({ "user.create": msg });
      notify.error(msg);
      return false;
    }

    const created = (createRes.body as { user?: { id: string } }).user;
    if (created?.id) {
      payload.userId = created.id;
    }
    onUserInvalidate?.();
    return true;
  }

  return true;
}

/** Validate + persist teacher form draft; surfaces field errors and toasts on failure. */
export async function runTeacherSaveFlow(input: TeacherSaveFlowInput): Promise<boolean> {
  input.setErrors({});
  const payload = buildTeacherSavePayload(input);

  const validationErrors: ValidationError[] | null = validateTeacherDraft(payload, {
    settings: input.settings,
    enabledTabs: input.enabledTabs,
    fields: input.fields,
    language: input.language,
  });
  if (validationErrors) {
    input.setErrors(teacherValidationErrorsByField(validationErrors));
    const firstField = validationErrors[0]?.fieldId;
    if (firstField) {
      focusTeacherValidationField(input.formInstanceId, firstField);
    }
    notify.error(input.t("common.formPleaseFixErrors"));
    return false;
  }

  const allowedDesignationRoles = input.teacherDraft.designationAssignableRoles;
  if (
    input.userAccountDraft?.enabled
    && allowedDesignationRoles?.length
    && !allowedDesignationRoles.includes(input.userAccountDraft.role)
  ) {
    input.setErrors({ 'user.role': input.t('faculty.designations.roleNotAllowed') });
    notify.error(input.t('faculty.designations.roleNotAllowed'));
    return false;
  }

  if (input.userAccountDraft?.enabled && !input.linkedUser) {
    const primaryEmail = input.linkedContact ? getPrimaryEmail(input.linkedContact) : null;
    if (!primaryEmail) {
      input.setErrors({ "user.email": input.t("teachers.form.noEmailWarning") });
      notify.error(input.t("teachers.form.noEmailWarning"));
      return false;
    }
    if (!input.userAccountDraft.role) {
      input.setErrors({ "user.role": input.t("users.errorRoleRequired") });
      notify.error(input.t("users.errorRoleRequired"));
      return false;
    }
    if (input.userAccountDraft.setupMethod === "password") {
      const pwd = input.userAccountDraft.password?.trim() || "";
      if (!pwd) {
        input.setErrors({ "user.password": input.t("users.addErrorPassword") });
        notify.error(input.t("users.addErrorPassword"));
        return false;
      }
      if (pwd.length < 8) {
        input.setErrors({ "user.password": input.t("auth.passwordCheckLength") });
        notify.error(input.t("auth.passwordCheckLength"));
        return false;
      }
    }
  }

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
      input.setSaving(false);
      return false;
    }

    if (duplicateReason) {
      input.setPendingSaveData(payload as Partial<Teacher>);
      input.setTypedDuplicateReason(duplicateReason);
      input.setDuplicateConfirmOpen(true);
      input.setSaving(false);
      return false;
    }

    const userOk = await syncUserAccount({
      userAccountDraft: input.userAccountDraft,
      linkedUser: input.linkedUser,
      contactId: payload.contactId as string | number,
      payload,
      t: input.t,
      setErrors: input.setErrors,
      onUserInvalidate: input.onUserInvalidate,
    });
    if (!userOk) {
      input.setSaving(false);
      return false;
    }

    await input.onSave(payload as unknown as Teacher);
    input.onBaselineReset?.(payload);
    if (!input.keepOpen) {
      input.onClose();
    }
    return true;
  } catch (err: unknown) {
    const validationMessage = getApiValidationMessage(err);
    const errText = String(err instanceof Error ? err.message : err || "").toLowerCase();
    const isEmployeeIdConflict =
      errText.includes("employeeid") ||
      errText.includes("employee_id") ||
      errText.includes("duplicate_employee") ||
      (typeof validationMessage === "string" && validationMessage.toLowerCase().includes("employee"));

    if (isEmployeeIdConflict) {
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

/** Commit the stashed draft after the user confirms "save anyway". */
export async function confirmPendingTeacherSave(input: {
  pendingSaveData: Partial<Teacher> | null;
  teacher?: Teacher;
  t: TranslationFunction;
  onSave: (teacher: Teacher) => void | Promise<void>;
  onClose: () => void;
  setSaving: (saving: boolean) => void;
  setPendingSaveData: (data: Partial<Teacher> | null) => void;
  setDuplicateConfirmOpen: (open: boolean) => void;
  userAccountDraft?: FacultyUserAccountDraft;
  linkedUser?: { id: string; role?: string } | null;
  onUserInvalidate?: () => void;
  setErrors?: (errors: Record<string, string>) => void;
}): Promise<void> {
  if (!input.pendingSaveData) return;
  input.setSaving(true);
  try {
    const userOk = await syncUserAccount({
      userAccountDraft: input.userAccountDraft,
      linkedUser: input.linkedUser,
      contactId: input.pendingSaveData.contactId,
      payload: input.pendingSaveData as Record<string, unknown>,
      t: input.t,
      setErrors: input.setErrors || (() => {}),
      onUserInvalidate: input.onUserInvalidate,
    });
    if (!userOk) {
      input.setSaving(false);
      return;
    }

    await input.onSave(input.pendingSaveData as Teacher);
    input.setPendingSaveData(null);
    input.setDuplicateConfirmOpen(false);
    input.onClose();
  } catch (err: unknown) {
    notifyTeacherSaveFailed(input.t, err, "teachers.form_save_confirm");
  } finally {
    input.setSaving(false);
  }
}
