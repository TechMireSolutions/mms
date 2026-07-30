import { useCallback, useMemo } from "react";
import type {
  Contact,
  FieldDefinition,
  Student,
  StudentDuplicateReason,
  StudentsSettings,
  ValidationError,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { DUPLICATE_ERROR_KEYS } from "@/tenant/features/students/hooks/studentFormValidation";
import {
  buildContactSelectPatch,
  buildParentSelectPatch,
} from "@/tenant/features/students/hooks/studentFormHandlers";
import {
  confirmPendingStudentSave,
  runStudentSaveFlow,
} from "@/tenant/features/students/hooks/studentFormSaveFlow";

export interface UseStudentFormActionHandlersOptions {
  student?: Partial<Student> | null;
  studentDraft: Partial<Student>;
  linkedContact: Contact | null | undefined;
  nextGrNumber: string | undefined;
  settings: StudentsSettings;
  enabledTabs: Set<string>;
  language: string;
  t: TranslationFunction;
  onSave: (student: Student) => void | Promise<void>;
  onClose: () => void;
  updateDraft: (patch: Partial<Student>) => void;
  updateContact: { mutateAsync: (args: { id: string; contact: Contact }) => Promise<unknown> };
  pendingSaveData: Partial<Student> | null;
  typedDuplicateReason: StudentDuplicateReason | null;
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;
  setSaving: (value: boolean) => void;
  setPendingSaveData: (value: Partial<Student> | null) => void;
  setTypedDuplicateReason: (value: StudentDuplicateReason | null) => void;
  setDuplicateConfirmOpen: (value: boolean) => void;
}

export function useStudentFormActionHandlers({
  student,
  studentDraft,
  linkedContact,
  nextGrNumber,
  settings,
  enabledTabs,
  language,
  t,
  onSave,
  onClose,
  updateDraft,
  updateContact,
  pendingSaveData,
  typedDuplicateReason,
  validationErrors,
  setValidationErrors,
  setSaving,
  setPendingSaveData,
  setTypedDuplicateReason,
  setDuplicateConfirmOpen,
}: UseStudentFormActionHandlersOptions) {
  const clearDuplicatePrompt = useCallback(() => {
    setDuplicateConfirmOpen(false);
    setTypedDuplicateReason(null);
    setPendingSaveData(null);
  }, [setDuplicateConfirmOpen, setPendingSaveData, setTypedDuplicateReason]);

  const handleDuplicateDialogOpenChange = useCallback((open: boolean) => {
    if (!open) clearDuplicatePrompt();
    else setDuplicateConfirmOpen(true);
  }, [clearDuplicatePrompt, setDuplicateConfirmOpen]);

  const handleSave = () => {
    void runStudentSaveFlow({
      studentDraft,
      student,
      linkedContact,
      linkedGenderRaw: linkedContact?.gender?.trim() || "",
      validationContext: {
        settings,
        enabledTabs,
        requiredTabs: new Set(settings.requiredTabs || []),
        fields: (settings.fields || {}) as unknown as Record<string, FieldDefinition[]>,
        language,
      },
      blueprintVersion: settings.version,
      t,
      onSave,
      onClose,
      setValidationErrors,
      setSaving,
      setPendingSaveData,
      setTypedDuplicateReason,
      setDuplicateConfirmOpen,
    });
  };

  const confirmDuplicateSave = () => {
    void confirmPendingStudentSave({
      pendingSaveData,
      student,
      blueprintVersion: settings.version,
      t,
      onSave,
      onClose,
      setSaving,
      setPendingSaveData,
      setDuplicateConfirmOpen,
    });
  };

  const handleContactSelect = (id: string | number | null): void => {
    const patch = buildContactSelectPatch(id, student, studentDraft, nextGrNumber);
    if (patch) updateDraft(patch);
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!studentDraft.contactId || !linkedContact) return;
    void updateContact.mutateAsync({
      id: String(studentDraft.contactId),
      contact: { ...linkedContact, avatar: avatarUrl },
    });
  };

  const handleParentSelect = (
    role: "father" | "mother" | "guardian",
    id: string | number | null,
    contactObj?: Contact | null,
  ): void => {
    updateDraft(buildParentSelectPatch(role, id, contactObj));
  };

  const errorSummary = useMemo(() => {
    if (typedDuplicateReason) return t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]);
    return "";
  }, [typedDuplicateReason, t]);

  const validationErrorSummary = useMemo(() => {
    if (validationErrors.length === 0) return undefined;
    return validationErrors.map((validationError) => validationError.message);
  }, [validationErrors]);

  return {
    clearDuplicatePrompt,
    handleDuplicateDialogOpenChange,
    handleSave,
    confirmDuplicateSave,
    handleContactSelect,
    handleStudentAvatarChange,
    handleParentSelect,
    errorSummary,
    validationErrorSummary,
    duplicateErrorKeys: DUPLICATE_ERROR_KEYS,
  };
}
