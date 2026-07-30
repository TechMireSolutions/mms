import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactMutations } from "@/tenant/hooks/collections/contacts";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { studentStatusBadgeConfig, studentStatusLabel } from "@/lib/students/studentStatusUi";
import { getInitialStudentDraft } from "@/tenant/features/students/components/studentFormDraft";
import type { StudentStatusSelectOption } from "@/tenant/features/students/components/StudentFormSectionShared";
import { useStudentFormLinkedData } from "@/tenant/features/students/hooks/useStudentFormLinkedData";
import { useStudentFormActionHandlers } from "@/tenant/features/students/hooks/useStudentFormActionHandlers";
import {
  type Student,
  resolveStudentStatuses,
  DEFAULT_STUDENT_ENABLED_TABS,
} from "@mms/shared";

export interface UseStudentFormStateOptions {
  student?: Partial<Student> | null;
  onClose: () => void;
  onSave: (student: Student) => void | Promise<void>;
}

export function useStudentFormState({ student, onClose, onSave }: UseStudentFormStateOptions) {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { updateContact } = useContactMutations();
  const { settings, statuses: configStatuses, isFieldEnabled } = useStudentConfig();

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<import("@mms/shared").ValidationError[]>([]);
  const [studentDraft, setStudentDraft] = useState<Partial<Student>>(() => getInitialStudentDraft(student));
  const [typedDuplicateReason, setTypedDuplicateReason] = useState<import("@mms/shared").StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);
  const grManuallyEdited = useRef(false);

  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const statusSelectOptions = useMemo((): StudentStatusSelectOption[] => {
    const resolved = [...resolveStudentStatuses(configStatuses)];
    const current = studentDraft.status || "active";
    if (current && !resolved.includes(current)) resolved.unshift(current);
    return resolved.map((status) => ({
      value: status,
      label: studentStatusLabel(t, status),
    }));
  }, [configStatuses, studentDraft.status, t]);

  useEffect(() => {
    setStudentDraft(getInitialStudentDraft(student));
    setValidationErrors([]);
    grManuallyEdited.current = false;
  }, [student]);

  const updateDraft = (patch: Partial<Student>) => {
    setStudentDraft((prev) => ({ ...prev, ...patch }));
  };

  const enabledTabs = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);

  const getFieldError = (fieldId: string) => {
    const fieldError = validationErrors.find((validationError) => validationError.fieldId === fieldId);
    return fieldError ? fieldError.message : undefined;
  };

  const {
    linkedContact,
    linkedGenderLabel,
    linkedDob,
    nextGrNumber,
    handleGrNumberChange,
    fatherExcludeIds,
    motherExcludeIds,
    guardianExcludeIds,
    excludeIds,
    isGrAutoAssigned,
  } = useStudentFormLinkedData({
    student,
    studentDraft,
    settings,
    grManuallyEdited,
    updateDraft,
    t,
  });

  useEffect(() => {
    if (student?.id || !nextGrNumber) return;
    if (!studentDraft.grNumber && !grManuallyEdited.current) {
      updateDraft({ grNumber: nextGrNumber });
    }
  }, [nextGrNumber, student?.id, studentDraft.grNumber]);

  const actions = useStudentFormActionHandlers({
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
  });

  return {
    t,
    language,
    student,
    saving,
    studentDraft,
    statusBadgeConfig,
    statusSelectOptions,
    enabledTabs,
    getFieldError,
    linkedContact,
    linkedGenderLabel,
    linkedDob,
    duplicateConfirmOpen,
    typedDuplicateReason,
    excludeIds,
    fatherExcludeIds,
    motherExcludeIds,
    guardianExcludeIds,
    isGrAutoAssigned,
    isFieldEnabled,
    handleGrNumberChange,
    updateDraft,
    ...actions,
  };
}
