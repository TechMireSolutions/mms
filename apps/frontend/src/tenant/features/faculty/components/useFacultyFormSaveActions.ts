import { useMemo, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { invalidateUsersQueries } from "@/tenant/hooks/collections/users";
import type {
  Contact,
  FieldDefinition,
  Teacher,
  TeacherDuplicateReason,
  TeachersSettings,
} from "@mms/shared";
import {
  teacherDraftSnapshot,
} from "@/tenant/features/faculty/components/facultyFormDraft";
import {
  confirmPendingTeacherSave,
  runTeacherSaveFlow,
} from "@/tenant/features/faculty/components/facultyFormSaveFlow";
import { DUPLICATE_ERROR_KEYS } from "@/tenant/features/faculty/components/facultyFormValidation";
import type { FacultyUserAccountDraft, LinkedUserInfo } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface UseFacultyFormSaveActionsInput {
  teacherDraft: Partial<Teacher>;
  teacher?: Teacher;
  autoGenerateId: boolean;
  nextEmployeeId?: string;
  formInstanceId: string;
  linkedContact?: Contact | null;
  settings: TeachersSettings;
  enabledTabs: Set<string>;
  fieldsMap: Record<string, FieldDefinition[]>;
  language: string;
  t: TranslationFunction;
  onSave: (teacher: Teacher) => void | Promise<void>;
  onClose: () => void;
  setBaselineSnapshot: (snapshot: string) => void;
  userAccountDraft: FacultyUserAccountDraft;
  linkedUser?: LinkedUserInfo | null;
  queryClient: QueryClient;
}

export function useFacultyFormSaveActions({
  teacherDraft,
  teacher,
  autoGenerateId,
  nextEmployeeId,
  formInstanceId,
  linkedContact,
  settings,
  enabledTabs,
  fieldsMap,
  language,
  t,
  onSave,
  onClose,
  setBaselineSnapshot,
  userAccountDraft,
  linkedUser,
  queryClient,
}: UseFacultyFormSaveActionsInput) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Teacher> | null>(null);
  const [typedDuplicateReason, setTypedDuplicateReason] = useState<TeacherDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);

  const clearDuplicatePrompt = () => {
    setDuplicateConfirmOpen(false);
    setTypedDuplicateReason(null);
    setPendingSaveData(null);
  };

  const handleDuplicateDialogOpenChange = (open: boolean) =>
    open ? setDuplicateConfirmOpen(true) : clearDuplicatePrompt();

  const validationErrorSummary = useMemo(() => {
    const messages = Object.values(errors).filter(Boolean);
    const reasonMessage = typedDuplicateReason ? t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]) : "";
    if (reasonMessage) messages.push(reasonMessage);
    return messages.length > 0 ? [...new Set(messages)] : undefined;
  }, [errors, typedDuplicateReason, t]);

  const handleSave = async (options?: { keepOpen?: boolean }): Promise<boolean> => {
    return await runTeacherSaveFlow({
      teacherDraft,
      teacher,
      autoGenerateId,
      nextEmployeeId,
      formInstanceId,
      linkedContact,
      settings,
      enabledTabs,
      fields: fieldsMap,
      language,
      t,
      onSave,
      onClose,
      keepOpen: options?.keepOpen,
      onBaselineReset: (payload) => setBaselineSnapshot(teacherDraftSnapshot(payload)),
      setErrors,
      setSaving,
      setPendingSaveData,
      setTypedDuplicateReason,
      setDuplicateConfirmOpen,
      userAccountDraft,
      linkedUser,
      onUserInvalidate: () => invalidateUsersQueries(queryClient),
    });
  };

  const confirmDuplicateSave = () => {
    void confirmPendingTeacherSave({
      pendingSaveData,
      teacher,
      t,
      onSave,
      onClose,
      setSaving,
      setPendingSaveData,
      setDuplicateConfirmOpen,
      userAccountDraft,
      linkedUser,
      onUserInvalidate: () => invalidateUsersQueries(queryClient),
      setErrors,
    });
  };

  return {
    saving,
    errors,
    setErrors,
    handleSave,
    confirmDuplicateSave,
    validationErrorSummary,
    pendingSaveData,
    typedDuplicateReason,
    duplicateConfirmOpen,
    clearDuplicatePrompt,
    handleDuplicateDialogOpenChange,
  };
}
