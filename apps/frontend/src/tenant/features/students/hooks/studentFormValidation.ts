import {
  type Student,
  type Contact,
  normalizeStoredStudent,
  getPrimaryEmail,
  listStudentContactRelationships,
  resolveStudentGuardianLinks,
  type StudentDuplicateReason,
  type AppTranslationKey,
  buildDynamicStudentSchema,
  validateDfsCustomFields,
  formatStudentZodIssues,
  type ValidationError,
  type FieldDefinition,
  type StudentsSettings,
  type TabConfig,
} from "@mms/shared";
import { checkStudentRegistrationDuplicate } from "@/tenant/features/students/hooks/useStudents";

export const DUPLICATE_ERROR_KEYS: Record<StudentDuplicateReason, AppTranslationKey> = {
  contact: "students.form.contactAlreadyStudent",
  email: "students.form.duplicateEmail",
  nameDob: "students.form.duplicateNameDob",
  grNumber: "students.form.duplicateGrNumber",
};

export interface StudentValidationContext {
  settings: StudentsSettings;
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  language: string;
  linkedGenderRaw: string;
  linkedDob: string;
  linkedContact?: Contact | null;
  dfsTabs?: TabConfig[];
}

export function validateStudentDraft(
  studentDraft: Partial<Student>,
  context: StudentValidationContext,
): ValidationError[] | null {
  const schema = buildDynamicStudentSchema(
    context.settings,
    context.enabledTabs,
    context.requiredTabs,
    context.fields,
    context.language,
  );

  const guardians = resolveStudentGuardianLinks(studentDraft, context.linkedContact ?? null);
  const validationDraft = {
    ...studentDraft,
    ...guardians,
    gender: context.linkedGenderRaw,
    dob: context.linkedDob,
  };

  const errors: ValidationError[] = [];

  const parseResult = schema.safeParse(validationDraft);
  if (!parseResult.success) {
    errors.push(...formatStudentZodIssues(parseResult.error, validationDraft, context.fields));
  }

  if (context.dfsTabs && context.dfsTabs.length > 0) {
    const customDataPayload = (studentDraft.customData as Record<string, unknown> | undefined) ?? {};
    const dfsErrors = validateDfsCustomFields(
      context.dfsTabs,
      customDataPayload,
      studentDraft as Record<string, unknown>,
    );
    errors.push(...dfsErrors);
  }

  return errors.length > 0 ? errors : null;
}

interface StudentDuplicateCheckInput {
  studentId?: string;
  contactId: string;
  linkedContact?: Contact | null;
  grNumber?: string;
}

export async function checkStudentFormDuplicate(
  input: StudentDuplicateCheckInput,
): Promise<StudentDuplicateReason | null> {
  const email = (input.linkedContact ? getPrimaryEmail(input.linkedContact) : null) || "";
  return checkStudentRegistrationDuplicate({
    excludeId: input.studentId ? String(input.studentId) : undefined,
    contactId: String(input.contactId),
    email,
    name: input.linkedContact?.name,
    dob: input.linkedContact?.dob || undefined,
    grNumber: input.grNumber,
  });
}

interface PrepareStudentSaveInput {
  data: Partial<Student>;
  studentId?: string | number;
  enrolledSessions?: Student["enrolledSessions"];
  blueprintVersion?: string | number | null;
}

export function prepareStudentForSave(input: PrepareStudentSaveInput): Student {
  return normalizeStoredStudent({
    ...input.data,
    registeredDate: input.data.registeredDate || undefined,
    ...(input.studentId != null ? { id: input.studentId } : {}),
    enrolledSessions: input.enrolledSessions || [],
    ...(input.blueprintVersion != null ? { _blueprintId: String(input.blueprintVersion) } : {}),
  }) as Student;
}

/** Exclude the student's relationship links (from Contacts) from the student-contact picker. */
export function buildStudentContactExcludeIds(
  linkedStudentContactIds: Array<string | number>,
  linkedContact?: Contact | null,
): string[] {
  const relatedIds = listStudentContactRelationships(linkedContact ?? null)
    .map((link) => link.contactId)
    .filter(Boolean)
    .map(String);
  return [...relatedIds, ...linkedStudentContactIds.map(String)];
}
