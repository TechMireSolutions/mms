import {
  buildDynamicTeacherSchema,
  formatTeacherZodIssues,
  type AppTranslationKey,
  type Contact,
  type FieldDefinition,
  type TeacherDuplicateReason,
  type TeachersSettings,
  type ValidationError,
} from "@mms/shared";
import { checkTeacherRegistrationDuplicate } from "@/tenant/features/faculty/hooks/useFaculty";
import { scrollAndFocusFirstError } from "@/lib/forms/formAutoScroll";

/** Focus the first invalid teacher form field with smooth auto-scroll. */
export function focusTeacherValidationField(formInstanceId: string, fieldId: string): void {
  const fieldAliases: Record<string, string[]> = {
    joinDate: ["teacher-join-date", "joinDate"],
    designation: ["designationId", "designation"],
    "user.role": ["faculty-user-role", "linked-user-role"],
    "user.password": ["faculty-user-password"],
    "user.email": ["contactId"],
  };

  const aliases = fieldAliases[fieldId] ?? [];
  const candidates = [
    `tf-${formInstanceId}-${fieldId}`,
    fieldId,
    fieldId === "contactId" ? "contactId" : "",
    ...aliases,
  ].filter(Boolean);

  scrollAndFocusFirstError(candidates, { behavior: "smooth", block: "center" });
}

export const DUPLICATE_ERROR_KEYS: Record<TeacherDuplicateReason, AppTranslationKey> = {
  contact: "faculty.form.contactAlreadyTeacher",
  employeeId: "faculty.form.duplicateEmployeeId",
};
export const FACULTY_DUPLICATE_ERROR_KEYS = DUPLICATE_ERROR_KEYS;


export interface TeacherDuplicateCheckInput {
  teacherId?: string;
  contactId: string;
  linkedContact?: Contact | null;
  employeeId?: string;
}

export async function checkTeacherFormDuplicate(
  input: TeacherDuplicateCheckInput,
): Promise<TeacherDuplicateReason | null> {
  return checkTeacherRegistrationDuplicate({
    excludeId: input.teacherId ? String(input.teacherId) : undefined,
    contactId: String(input.contactId),
    employeeId: input.employeeId?.trim() || undefined,
  });
}

export interface TeacherValidationContext {
  settings: TeachersSettings;
  enabledTabs: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  language: string;
}

/** Validate a teacher form draft against the dynamic Setup registry schema. */
export function validateTeacherDraft(
  draft: Record<string, unknown>,
  context: TeacherValidationContext,
): ValidationError[] | null {
  const schema = buildDynamicTeacherSchema(
    context.settings,
    context.enabledTabs,
    context.fields,
    context.language,
  );
  const result = schema.safeParse(draft);
  const errors: ValidationError[] = result.success
    ? []
    : formatTeacherZodIssues(result.error, draft, context.fields);

  return errors.length > 0 ? errors : null;
}

export function teacherValidationErrorsByField(
  errors: ValidationError[],
): Record<string, string> {
  const byField: Record<string, string> = {};
  for (const error of errors) {
    if (!byField[error.fieldId]) {
      byField[error.fieldId] = error.message;
    }
  }
  return byField;
}

export const focusFacultyValidationField = focusTeacherValidationField;
export const facultyValidationErrorsByField = teacherValidationErrorsByField;
export const validateFacultyDraft = validateTeacherDraft;
export const checkFacultyFormDuplicate = checkTeacherFormDuplicate;
export type FacultyDuplicateCheckInput = TeacherDuplicateCheckInput;
export type FacultyValidationContext = TeacherValidationContext;

