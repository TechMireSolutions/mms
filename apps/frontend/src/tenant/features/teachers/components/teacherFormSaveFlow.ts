import { notify } from "@/lib/notify";
import type { TeachersSettings, Teacher, ValidationError } from "@mms/shared";
import type { FieldDefinition } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  teacherValidationErrorsByField,
  validateTeacherDraft,
} from "@/tenant/features/teachers/components/teacherFormValidation";

export interface TeacherSaveFlowInput {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
  settings: TeachersSettings;
  enabledTabs: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  language: string;
  visibleTabKeys: string[];
  t: TranslationFunction;
  onSave: (teacher: Teacher) => void | Promise<void>;
  onClose: () => void;
  setErrors: (errors: Record<string, string>) => void;
  setActiveTab: (tabId: string) => void;
  setSaving: (saving: boolean) => void;
}

/** Validate + persist teacher form draft; surfaces field errors and toasts on failure. */
export async function runTeacherSaveFlow(input: TeacherSaveFlowInput): Promise<void> {
  input.setErrors({});
  const resolvedEmployeeId = input.teacherDraft.employeeId?.trim()
    || (input.autoGenerateId && !input.teacher?.id ? input.nextEmployeeId?.trim() : undefined);

  const payload = {
    ...input.teacherDraft,
    employeeId: resolvedEmployeeId,
    contactId: String(input.teacherDraft.contactId || ""),
    ...(input.teacher?.id != null ? { id: input.teacher.id } : {}),
  } as Record<string, unknown>;

  const validationErrors: ValidationError[] | null = validateTeacherDraft(payload, {
    settings: input.settings,
    enabledTabs: input.enabledTabs,
    fields: input.fields,
    language: input.language,
  });
  if (validationErrors) {
    input.setErrors(teacherValidationErrorsByField(validationErrors));
    const firstTab = validationErrors[0]?.tabId;
    if (firstTab && input.visibleTabKeys.includes(firstTab)) {
      input.setActiveTab(firstTab);
    }
    notify.error(input.t("common.formPleaseFixErrors"));
    return;
  }

  input.setSaving(true);
  try {
    await input.onSave(payload as unknown as Teacher);
    input.onClose();
  } catch (err: unknown) {
    notify.error(input.t("teachers.toast.saveFailed"), {
      description: err instanceof Error ? err.message : String(err),
    });
  } finally {
    input.setSaving(false);
  }
}
