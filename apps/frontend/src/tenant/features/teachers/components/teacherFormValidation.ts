import {
  buildDynamicTeacherSchema,
  formatTeacherZodIssues,
  type FieldDefinition,
  type TeachersSettings,
  type ValidationError,
} from "@mms/shared";

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
