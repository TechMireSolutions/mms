import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactMutations } from "@/tenant/hooks/collections/contacts";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { studentStatusBadgeConfig, studentStatusLabel } from "@/lib/students/studentStatusUi";
import { getInitialStudentDraft, studentDraftSnapshot } from "@/tenant/features/students/components/studentFormDraft";
import type { StudentStatusSelectOption } from "@/tenant/features/students/components/StudentFormSectionShared";
import { useStudentFormLinkedData } from "@/tenant/features/students/hooks/useStudentFormLinkedData";
import { useStudentFormActionHandlers } from "@/tenant/features/students/hooks/useStudentFormActionHandlers";
import { useStudentLookupMutation } from "@/tenant/features/students/hooks/useStudentLookups";
import { isStudentCreate } from "@/tenant/features/students/hooks/studentFormHandlers";
import {
  type FieldDefinition,
  type Student,
  resolveStudentStatuses,
  DEFAULT_STUDENT_ENABLED_TABS,
} from "@mms/shared";

interface UseStudentFormStateOptions {
  student?: Partial<Student> | null;
  onClose: () => void;
  onSave: (student: Student) => void | Promise<void>;
}

export function useStudentFormState({ student, onClose, onSave }: UseStudentFormStateOptions) {
  const { t, dir } = useTranslation();
  const { language } = useGlobalSettings();
  const { updateContact } = useContactMutations();
  const { settings, statuses: configStatuses, isFieldEnabled, isFieldRequired } = useStudentConfig();
  const lookupMutation = useStudentLookupMutation();

  const formInstanceId = String(student?.id ?? "new");
  const fields = (() => (settings.fields || {}) as Record<string, FieldDefinition[]>)();

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<import("@mms/shared").ValidationError[]>([]);
  const [studentDraft, setStudentDraft] = useState<Partial<Student>>(() =>
    getInitialStudentDraft({ student, fields }),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    studentDraftSnapshot(getInitialStudentDraft({ student, fields })),
  );
  const [typedDuplicateReason, setTypedDuplicateReason] = useState<import("@mms/shared").StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);
  const grManuallyEdited = useRef(false);

  const statusBadgeConfig = (() => studentStatusBadgeConfig(t))();
  const statusSelectOptions = ((): StudentStatusSelectOption[] => {
    const resolved = [...resolveStudentStatuses(configStatuses)];
    const current = studentDraft.status || "active";
    if (current && !resolved.includes(current)) resolved.unshift(current);
    return resolved.map((status) => ({
      value: status,
      label: studentStatusLabel(t, status),
    }));
  })();

  const handleUpdateStatuses = async (nextStatuses: string[]) => {
    await lookupMutation.mutateAsync({ kind: "statuses", items: nextStatuses });
  };

  useEffect(() => {
    const nextDraft = getInitialStudentDraft({ student, fields });
    setStudentDraft(nextDraft);
    setBaselineSnapshot(studentDraftSnapshot(nextDraft));
    setValidationErrors([]);
    grManuallyEdited.current = false;
  }, [student, fields]);

  const updateDraft = (patch: Partial<Student>) => {
    setStudentDraft((prev) => ({ ...prev, ...patch }));
  };

  const isDirty = studentDraftSnapshot(studentDraft) !== baselineSnapshot;

  const enabledTabs = (() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS))();

  const getFieldError = (fieldId: string) => {
    const fieldError = validationErrors.find((validationError) => validationError.fieldId === fieldId);
    return fieldError ? fieldError.message : undefined;
  };

  const {
    linkedContact,
    linkedGenderRaw,
    linkedGenderLabel,
    linkedDob,
    nextGrNumber,
    autoGenerateId,
    handleGrNumberChange,
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

  // Autofill next GR for create without marking the form dirty.
  useEffect(() => {
    if (!isStudentCreate(student) || !autoGenerateId || !nextGrNumber) return;
    if (grManuallyEdited.current) return;
    setStudentDraft((prev) => {
      if (prev.grNumber) return prev;
      const nextDraft = { ...prev, grNumber: nextGrNumber };
      setBaselineSnapshot(studentDraftSnapshot(nextDraft));
      return nextDraft;
    });
  }, [nextGrNumber, student, autoGenerateId]);

  const actions = useStudentFormActionHandlers({
    student,
    studentDraft,
    linkedContact,
    nextGrNumber,
    autoGenerateId,
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
    formInstanceId,
    onBaselineReset: (data) => setBaselineSnapshot(studentDraftSnapshot(data)),
  });

  return {
    t,
    dir,
    language,
    saving,
    studentDraft,
    statusBadgeConfig,
    statusSelectOptions,
    statuses: configStatuses,
    onUpdateStatuses: handleUpdateStatuses,
    fields,
    formInstanceId,
    getFieldError,
    linkedContact,
    linkedGenderRaw,
    linkedGenderLabel,
    linkedDob,
    duplicateConfirmOpen,
    typedDuplicateReason,
    excludeIds,
    isGrAutoAssigned,
    grInputDisabled: autoGenerateId && isStudentCreate(student) && Boolean(nextGrNumber),
    isDirty,
    isFieldEnabled,
    isFieldRequired,
    handleGrNumberChange,
    updateDraft,
    ...actions,
  };
}


