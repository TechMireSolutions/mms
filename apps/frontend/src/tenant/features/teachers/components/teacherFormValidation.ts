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
import { checkTeacherRegistrationDuplicate } from "@/tenant/features/teachers/hooks/useTeachers";

export const DUPLICATE_ERROR_KEYS: Record<TeacherDuplicateReason, AppTranslationKey> = {
  contact: "teachers.form.contactAlreadyTeacher",
  employeeId: "teachers.form.duplicateEmployeeId",
};

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
  if (result.success) return null;
  return formatTeacherZodIssues(result.error, draft, context.fields);
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
