import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/teachers/hooks/useTeachers";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { teacherStatusOptions } from "@/lib/teachers/teacherStatusUi";
import { useTeacherStatusConfig, useTeacherLookupOptions } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import {
  Teacher,
  DEFAULT_TEACHERS_SETTINGS,
  TeacherDuplicateReason,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
} from "@mms/shared";
import type { TeacherStatusOption } from "@/tenant/features/teachers/components/TeacherFormSections";
import {
  getInitialTeacherDraft,
  teacherDraftSnapshot,
} from "@/tenant/features/teachers/components/teacherFormDraft";
import {
  confirmPendingTeacherSave,
  runTeacherSaveFlow,
} from "@/tenant/features/teachers/components/teacherFormSaveFlow";
import {
  DUPLICATE_ERROR_KEYS,
} from "@/tenant/features/teachers/components/teacherFormValidation";
import { resolveTeacherFormModalTabs } from "@/tenant/features/teachers/components/teacherFormTabs";

export interface UseTeacherFormControllerOptions {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
}

export function useTeacherFormController({ teacher, onClose, onSave }: UseTeacherFormControllerOptions) {
  const { t, dir, language } = useTranslation();
  const { settings, isFieldEnabled, isFieldRequired } = useTeacherConfig();

  const { statusOptions: statusValues, specializationOptions } = useTeacherLookupOptions();
  const defaultSpecialization =
    settings.defaultSpecialization
    || specializationOptions[0]
    || DEFAULT_TEACHERS_SETTINGS.defaultSpecialization;
  const idPrefix = settings.idPrefix || DEFAULT_TEACHERS_SETTINGS.idPrefix;
  const autoGenerateId = settings.autoGenerateId !== false;
  const requireContactLink = settings.requireContactLink !== false;

  const fieldsMap = useMemo(
    () => resolveTeacherFieldsMapForColumnSync(settings.fields),
    [settings.fields],
  );

  const statusOptions = useMemo<TeacherStatusOption[]>(
    () => teacherStatusOptions(t, statusValues),
    [statusValues, t],
  );

  const statusConfig = useTeacherStatusConfig();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Teacher> | null>(null);
  const [typedDuplicateReason, setTypedDuplicateReason] = useState<TeacherDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const formInstanceId = String(teacher?.id ?? "new");

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() =>
    getInitialTeacherDraft({ teacher, defaultSpecialization }),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    teacherDraftSnapshot(getInitialTeacherDraft({ teacher, defaultSpecialization })),
  );

  useEffect(() => {
    const nextDraft = getInitialTeacherDraft({ teacher, defaultSpecialization });
    setTeacherDraft(nextDraft);
    setBaselineSnapshot(teacherDraftSnapshot(nextDraft));
    setErrors({});
  }, [teacher, defaultSpecialization]);

  const updateDraft = (patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  };

  const isDirty = teacherDraftSnapshot(teacherDraft) !== baselineSnapshot;

  const enabledTabs = useMemo(
    () => new Set(resolveTeacherEnabledTabIds(settings)),
    [settings],
  );

  const visibleTabs = useMemo(() => {
    return resolveTeacherFormModalTabs(settings.formTabs, enabledTabs).map((tabItem) => ({
      key: tabItem.key,
      icon: tabItem.icon,
      label: resolveRegistryLabel(tabItem, t),
    }));
  }, [settings.formTabs, enabledTabs, t]);

  useEffect(() => {
    if (!visibleTabs.some((tabItem) => tabItem.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "basic");
    }
  }, [activeTab, visibleTabs]);

  const getFieldError = (fieldId: string): string | undefined =>
    errors[fieldId] || errors[`custom:${fieldId}`];

  /** FormModal error banner — deduped field validation messages (Students parity). */
  const validationErrorSummary = useMemo(() => {
    const messages = Object.values(errors).filter((message) => Boolean(message));
    const reasonMessage = typedDuplicateReason
      ? t(DUPLICATE_ERROR_KEYS[typedDuplicateReason])
      : "";
    if (reasonMessage) messages.push(reasonMessage);
    return messages.length > 0 ? [...new Set(messages)] : undefined;
  }, [errors, typedDuplicateReason, t]);

  const { data: linkedContact } = useContactById(
    teacherDraft.contactId ? String(teacherDraft.contactId) : undefined,
    !!teacherDraft.contactId,
  );

  const { data: linkedTeacherContactIds = [] } = useTeacherLinkedContactIds(
    teacher?.id ? String(teacher.id) : undefined,
  );

  const { data: nextEmployeeId } = useTeacherNextEmployeeId({
    prefix: idPrefix,
    enabled: !teacher?.id && autoGenerateId,
  });

  useEffect(() => {
    if (teacher?.id || !autoGenerateId || !nextEmployeeId) return;
    if (!teacherDraft.employeeId) {
      setTeacherDraft((prev) => {
        if (prev.employeeId) return prev;
        const nextDraft = { ...prev, employeeId: nextEmployeeId };
        setBaselineSnapshot(teacherDraftSnapshot(nextDraft));
        return nextDraft;
      });
    }
  }, [nextEmployeeId, teacher?.id, teacherDraft.employeeId, autoGenerateId]);

  const clearDuplicatePrompt = () => {
    setDuplicateConfirmOpen(false);
    setTypedDuplicateReason(null);
    setPendingSaveData(null);
  };

  const handleDuplicateDialogOpenChange = (open: boolean) => {
    if (!open) clearDuplicatePrompt();
    else setDuplicateConfirmOpen(true);
  };

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
      visibleTabKeys: visibleTabs.map((tab) => tab.key),
      t,
      onSave,
      onClose,
      keepOpen: options?.keepOpen,
      onBaselineReset: (payload) => {
        setBaselineSnapshot(teacherDraftSnapshot(payload));
      },
      setErrors,
      setActiveTab,
      setSaving,
      setPendingSaveData,
      setTypedDuplicateReason,
      setDuplicateConfirmOpen,
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
    });
  };

  return {
    t,
    dir,
    language,
    saving,
    errors,
    teacherDraft,
    isDirty,
    defaultSpecialization,
    specializationOptions,
    statusOptions,
    statusConfig,
    autoGenerateId,
    requireContactLink,
    fieldsMap,
    linkedContact,
    linkedTeacherContactIds,
    idPrefix,
    nextEmployeeId,
    formInstanceId,
    activeTab,
    setActiveTab,
    visibleTabs,
    isFieldEnabled,
    isFieldRequired,
    getFieldError,
    updateDraft,
    handleSave,
    validationErrorSummary,
    pendingSaveData,
    typedDuplicateReason,
    duplicateConfirmOpen,
    clearDuplicatePrompt,
    handleDuplicateDialogOpenChange,
    confirmDuplicateSave,
    duplicateErrorKeys: DUPLICATE_ERROR_KEYS,
  };
}

