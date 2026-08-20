import { notify } from "@/lib/notify";
import type {
  TeachersSettings,
  Teacher,
  TeacherDuplicateReason,
  Contact,
  ValidationError,
} from "@mms/shared";
import type { FieldDefinition } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";
import { reportClientError } from "@/lib/clientErrorReporting";
import {
  checkTeacherFormDuplicate,
  teacherValidationErrorsByField,
  validateTeacherDraft,
} from "@/tenant/features/teachers/components/teacherFormValidation";

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
  visibleTabKeys: string[];
  t: TranslationFunction;
  onSave: (teacher: Teacher) => void | Promise<void>;
  onClose: () => void;
  keepOpen?: boolean;
  onBaselineReset?: (payload: Partial<Teacher>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setActiveTab: (tabId: string) => void;
  setSaving: (saving: boolean) => void;
  setPendingSaveData: (data: Partial<Teacher> | null) => void;
  setTypedDuplicateReason: (reason: TeacherDuplicateReason | null) => void;
  setDuplicateConfirmOpen: (open: boolean) => void;
}

/** Focus the first invalid teacher form field (custom fields use the "tf" id prefix). */
function focusTeacherValidationField(formInstanceId: string, fieldId: string): void {
  const candidates = [
    `tf-${formInstanceId}-${fieldId}`,
    fieldId,
    fieldId === "contactId" ? "contactId" : "",
  ].filter(Boolean);

  const tryFocus = (): boolean => {
    for (const candidate of candidates) {
      const target = document.getElementById(candidate);
      if (target instanceof HTMLElement) {
        target.focus();
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return true;
      }
    }
    return false;
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (tryFocus()) return;
      window.setTimeout(() => {
        tryFocus();
      }, 50);
    });
  });
}

/** Build the save payload (resolved employeeId + typed contactId) from the draft. */
function buildTeacherSavePayload(input: {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
}): Record<string, unknown> {
  const resolvedEmployeeId = input.teacherDraft.employeeId?.trim()
    || (input.autoGenerateId && !input.teacher?.id ? input.nextEmployeeId?.trim() : undefined);

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
    const firstTab = validationErrors[0]?.tabId;
    if (firstTab && input.visibleTabKeys.includes(firstTab)) {
      input.setActiveTab(firstTab);
    }
    const firstField = validationErrors[0]?.fieldId;
    if (firstField) {
      focusTeacherValidationField(input.formInstanceId, firstField);
    }
    notify.error(input.t("common.formPleaseFixErrors"));
    return false;
  }

  input.setSaving(true);
  try {
    const duplicateReason = await checkTeacherFormDuplicate({
      teacherId: input.teacher?.id ? String(input.teacher.id) : undefined,
      contactId: String(input.teacherDraft.contactId || ""),
      linkedContact: input.linkedContact,
      employeeId: typeof payload.employeeId === "string" ? payload.employeeId : undefined,
    });

    if (duplicateReason) {
      input.setPendingSaveData(payload as Partial<Teacher>);
      input.setTypedDuplicateReason(duplicateReason);
      input.setDuplicateConfirmOpen(true);
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
}): Promise<void> {
  if (!input.pendingSaveData) return;
  input.setSaving(true);
  try {
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
