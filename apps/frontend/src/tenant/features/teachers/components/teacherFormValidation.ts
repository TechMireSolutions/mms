import {
  buildDynamicTeacherSchema,
  formatTeacherZodIssues,
  validateDfsCustomFields,
  type AppTranslationKey,
  type Contact,
  type FieldDefinition,
  type TabConfig,
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
  dfsTabs?: TabConfig[];
}

/** Validate a teacher form draft against the dynamic Setup registry schema + DFS customData. */
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

  // DFS Dynamic Zod schema validation for active custom fields across module tabs
  const customData = (draft.customData as Record<string, unknown> | undefined) ?? {};
  const dfsErrors = validateDfsCustomFields(context.dfsTabs, customData, draft);
  errors.push(...dfsErrors);

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
