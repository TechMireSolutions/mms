import {
  type FacultyMember,
  getPrimaryEmail,
} from "@mms/shared";
import { notify } from "@/lib/notify";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";
import { extractEmployeeId } from "@/tenant/features/faculty/components/facultyFormDraft";
import type { FacultySaveFlowInput } from "@/tenant/features/faculty/components/facultyFormSaveFlow";

export interface FacultySavePayloadInput {
  facultyDraft?: Partial<FacultyMember>;
  faculty?: FacultyMember;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
}

/** Build the save payload (resolved employeeId + typed contactId) from the draft. */
export function buildFacultySavePayload(input: FacultySavePayloadInput): Partial<FacultyMember> {
  const draft = input.facultyDraft ?? {};
  const entity = input.faculty;
  const rawEmployeeId = extractEmployeeId(draft.employeeId);
  const rawNextEmployeeId = extractEmployeeId(input.nextEmployeeId);
  const resolvedEmployeeId = rawEmployeeId || (input.autoGenerateId && !entity?.id ? rawNextEmployeeId : undefined);

  const payload: Partial<FacultyMember> = {
    ...draft,
    employeeId: resolvedEmployeeId,
    contactId: String(draft.contactId || ""),
    ...(entity?.id != null ? { id: entity.id } : {}),
  };

  delete (payload as Record<string, unknown>).designationAssignableRoles;
  delete (payload as Record<string, unknown>).contact;
  delete (payload as Record<string, unknown>).subordinates;
  return payload;
}

/** Validates email, role, and password requirements when user account creation is requested. */
export function validateUserDraftRequirements(input: FacultySaveFlowInput): boolean {
  if (!input.userAccountDraft?.enabled || input.linkedUser) return true;

  const primaryEmail = input.linkedContact ? getPrimaryEmail(input.linkedContact) : null;
  if (!primaryEmail) {
    const warning = input.t("faculty.form.noEmailWarning");
    input.setErrors({ "user.email": warning });
    notify.error(warning);
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

export { type FacultySaveFlowInput };
