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
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
} from "@mms/shared";
import type { TeacherStatusOption } from "@/tenant/features/teachers/components/TeacherFormSections";
import {
  getInitialTeacherDraft,
  teacherDraftSnapshot,
} from "@/tenant/features/teachers/components/teacherFormDraft";
import { runTeacherSaveFlow } from "@/tenant/features/teachers/components/teacherFormSaveFlow";
import { resolveTeacherFormModalTabs } from "@/tenant/features/teachers/components/teacherFormTabs";

export interface UseTeacherFormControllerOptions {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
}

export function useTeacherFormController({ teacher, onClose, onSave }: UseTeacherFormControllerOptions) {
  const { t, language } = useTranslation();
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
  const formInstanceId = String(teacher?.id ?? "new");

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() =>
    getInitialTeacherDraft(teacher, defaultSpecialization),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    teacherDraftSnapshot(getInitialTeacherDraft(teacher, defaultSpecialization)),
  );

  useEffect(() => {
    const nextDraft = getInitialTeacherDraft(teacher, defaultSpecialization);
    setTeacherDraft(nextDraft);
    setBaselineSnapshot(teacherDraftSnapshot(nextDraft));
    setErrors({});
    setActiveTab("basic");
  }, [teacher, defaultSpecialization]);

  const updateDraft = (patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  };

  const isDirty = teacherDraftSnapshot(teacherDraft) !== baselineSnapshot;

  const enabledTabs = useMemo(
    () => new Set(resolveTeacherEnabledTabIds(settings)),
    [settings],
  );

  const visibleTabs = useMemo(
    () =>
      resolveTeacherFormModalTabs(settings.formTabs, enabledTabs).map((tabItem) => ({
        key: tabItem.key,
        icon: tabItem.icon,
        label: resolveRegistryLabel(tabItem, t),
      })),
    [settings.formTabs, enabledTabs, t],
  );

  useEffect(() => {
    if (!visibleTabs.some((tabItem) => tabItem.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "basic");
    }
  }, [activeTab, visibleTabs]);

  const getFieldError = (fieldId: string): string | undefined =>
    errors[fieldId] || errors[`custom:${fieldId}`];

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

  const handleSave = async () => {
    await runTeacherSaveFlow({
      teacherDraft,
      teacher,
      autoGenerateId,
      nextEmployeeId,
      settings,
      enabledTabs,
      fields: fieldsMap,
      language,
      visibleTabKeys: visibleTabs.map((tab) => tab.key),
      t,
      onSave,
      onClose,
      setErrors,
      setActiveTab,
      setSaving,
    });
  };

  return {
    t,
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
  };
}
