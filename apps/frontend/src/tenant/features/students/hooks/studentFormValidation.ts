import {
  type Student,
  type Contact,
  normalizeStoredStudent,
  toTitleCase,
  getPrimaryEmail,
  type StudentDuplicateReason,
  type AppTranslationKey,
  buildDynamicStudentSchema,
  formatStudentZodIssues,
  type ValidationError,
  type FieldDefinition,
  type StudentsSettings,
} from "@mms/shared";
import { checkStudentRegistrationDuplicate } from "@/tenant/features/students/hooks/useStudents";

export const DUPLICATE_ERROR_KEYS: Record<StudentDuplicateReason, AppTranslationKey> = {
  contact: "students.form.contactAlreadyStudent",
  email: "students.form.duplicateEmail",
  nameDob: "students.form.duplicateNameDob",
};

export interface StudentValidationContext {
  settings: StudentsSettings;
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  language: string;
  linkedGenderRaw: string;
  linkedDob: string;
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

  const validationDraft = {
    ...studentDraft,
    gender: context.linkedGenderRaw,
    dob: context.linkedDob,
  };
  const parseResult = schema.safeParse(validationDraft);
  if (!parseResult.success) {
    return formatStudentZodIssues(parseResult.error, validationDraft, context.fields);
  }
  return null;
}

export interface StudentDuplicateCheckInput {
  studentId?: string;
  contactId: string;
  linkedContact?: Contact | null;
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
  });
}

export interface PrepareStudentSaveInput {
  data: Partial<Student>;
  studentId?: string | number;
  enrolledSessions?: Student["enrolledSessions"];
  blueprintVersion?: string | number | null;
}

export function prepareStudentForSave(input: PrepareStudentSaveInput): Student {
  const saved = {
    ...input.data,
    registeredDate: input.data.registeredDate || undefined,
    fatherName: input.data.fatherName ? toTitleCase(input.data.fatherName) : "",
    motherName: input.data.motherName ? toTitleCase(input.data.motherName) : "",
    guardianName: input.data.guardianName ? toTitleCase(input.data.guardianName) : "",
  };

  return normalizeStoredStudent({
    ...saved,
    ...(input.studentId != null ? { id: input.studentId } : {}),
    enrolledSessions: input.enrolledSessions || [],
    ...(input.blueprintVersion != null ? { _blueprintId: String(input.blueprintVersion) } : {}),
  }) as Student;
}

export function getParentExcludeIds(
  studentDraft: Partial<Student>,
  selfRole: "father" | "mother" | "guardian",
): string[] {
  return [
    studentDraft.contactId,
    selfRole !== "father" ? studentDraft.fatherContactId : null,
    selfRole !== "mother" ? studentDraft.motherContactId : null,
    selfRole !== "guardian" ? studentDraft.guardianContactId : null,
  ]
    .filter(Boolean)
    .map(String);
}

export function buildStudentContactExcludeIds(
  studentDraft: Partial<Student>,
  linkedStudentContactIds: Array<string | number>,
): string[] {
  const list = [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId]
    .filter(Boolean)
    .map(String);
  return [...list, ...linkedStudentContactIds.map(String)];
}
