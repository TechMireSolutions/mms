import {
  type Teacher,
  getPrimaryEmail,
} from "@mms/shared";
import { notify } from "@/lib/notify";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";
import { extractEmployeeId } from "@/tenant/features/faculty/components/facultyFormDraft";
import type { TeacherSaveFlowInput } from "@/tenant/features/faculty/components/facultyFormSaveFlow";

/** Build the save payload (resolved employeeId + typed contactId) from the draft. */
export function buildTeacherSavePayload(input: {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
}): Partial<Teacher> {
  const rawEmployeeId = extractEmployeeId(input.teacherDraft.employeeId);
  const rawNextEmployeeId = extractEmployeeId(input.nextEmployeeId);
  const resolvedEmployeeId = rawEmployeeId || (input.autoGenerateId && !input.teacher?.id ? rawNextEmployeeId : undefined);

  const payload: Partial<Teacher> = {
    ...input.teacherDraft,
    employeeId: resolvedEmployeeId,
    contactId: String(input.teacherDraft.contactId || ""),
    ...(input.teacher?.id != null ? { id: input.teacher.id } : {}),
  };

  delete (payload as Record<string, unknown>).designationAssignableRoles;
  delete (payload as Record<string, unknown>).designationEndsOn;
  delete (payload as Record<string, unknown>).contact;
  delete (payload as Record<string, unknown>).subordinates;
  return payload;
}

/** Validates email, role, and password requirements when user account creation is requested. */
export function validateUserDraftRequirements(input: TeacherSaveFlowInput): boolean {
  if (!input.userAccountDraft?.enabled || input.linkedUser) return true;

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
    if (!pwd || pwd.length < 8) {
      const errKey = !pwd ? "users.addErrorPassword" : "auth.passwordCheckLength";
      input.setErrors({ "user.password": input.t(errKey) });
      notify.error(input.t(errKey));
      return false;
    }
  }
  return true;
}

/** Detects if a save error is an employee ID uniqueness conflict. */
export function isEmployeeIdConflictError(err: unknown): boolean {
  const validationMessage = getApiValidationMessage(err);
  const errText = String(err instanceof Error ? err.message : err || "").toLowerCase();
  return (
    errText.includes("employeeid") ||
    errText.includes("employee_id") ||
    errText.includes("duplicate_employee") ||
    (typeof validationMessage === "string" && validationMessage.toLowerCase().includes("employee"))
  );
}
