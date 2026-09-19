import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useUsersContractList, invalidateUsersQueries } from "@/tenant/hooks/collections/users";
import { useFacultyLookupMutation } from "@/tenant/features/faculty/hooks/useFacultyLookups";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/faculty/hooks/useFaculty";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { teacherStatusOptions } from "@/lib/faculty/facultyStatusUi";
import { useTeacherStatusConfig, useTeacherLookupOptions } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import {
  type FacultyMember,
  type Teacher,
  DEFAULT_TEACHERS_SETTINGS,
  type TeacherDuplicateReason,
  getContactQualification,
  getContactSpecialization,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
} from "@mms/shared";
import { extractEmployeeId, getInitialTeacherDraft, teacherDraftSnapshot } from "@/tenant/features/faculty/components/facultyFormDraft";
import { confirmPendingTeacherSave, runTeacherSaveFlow } from "@/tenant/features/faculty/components/facultyFormSaveFlow";
import { DUPLICATE_ERROR_KEYS } from "@/tenant/features/faculty/components/facultyFormValidation";
import type { TeacherStatusOption } from '@/tenant/features/faculty/components/FacultyFormSections';
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface FacultyFormControllerOptions {
  faculty?: FacultyMember;
  teacher?: Teacher;
  onClose: () => void;
  onSave: (faculty: FacultyMember) => void | Promise<void>;
}

export type UseTeacherFormControllerOptions = FacultyFormControllerOptions;
export type UseFacultyFormControllerOptions = FacultyFormControllerOptions;

const DEFAULT_USER_ACCOUNT_DRAFT: FacultyUserAccountDraft = {
  enabled: false,
  role: "teacher",
  setupMethod: "password",
  password: "",
  forceReset: true,
};

export function useTeacherFormController({
  teacher: teacherProp,
  faculty,
  onClose,
  onSave,
}: FacultyFormControllerOptions) {
  const teacher = faculty ?? teacherProp;

  const queryClient = useQueryClient();
  const { t, dir, language } = useTranslation();

  const { settings, isFieldEnabled, isFieldRequired } = useTeacherConfig();

  const {
    statusOptions: statusValues,
    specializationOptions,
    designationOptions,
  } = useTeacherLookupOptions();

  const { mutateAsync: mutateLookup } = useFacultyLookupMutation();
  const handleUpdateDesignations = async (next: string[]) => {
    await mutateLookup({ kind: "designations", items: next });
  };

  const defaultSpecialization =
    settings.defaultSpecialization
    || specializationOptions[0]
    || DEFAULT_TEACHERS_SETTINGS.defaultSpecialization;
  const idPrefix = settings.idPrefix || DEFAULT_TEACHERS_SETTINGS.idPrefix;
  const autoGenerateId = settings.autoGenerateId !== false;
  const requireContactLink = settings.requireContactLink !== false;

  const fieldsMap = (() => resolveTeacherFieldsMapForColumnSync(settings.fields))();

  const statusOptions = (() => teacherStatusOptions(t, statusValues))() as TeacherStatusOption[];

  const statusConfig = useTeacherStatusConfig();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const [userAccountDraft, setUserAccountDraft] = useState<FacultyUserAccountDraft>(DEFAULT_USER_ACCOUNT_DRAFT);

  useEffect(() => {
    const nextDraft = getInitialTeacherDraft({ teacher, defaultSpecialization });
    setTeacherDraft(nextDraft);
    setBaselineSnapshot(teacherDraftSnapshot(nextDraft));
    setErrors({});
    setUserAccountDraft(DEFAULT_USER_ACCOUNT_DRAFT);
  }, [teacher, defaultSpecialization]);

  const updateDraft = (patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  };

  const isDirty =
    teacherDraftSnapshot(teacherDraft) !== baselineSnapshot
    || userAccountDraft.enabled;

  const enabledTabs = (() => new Set(resolveTeacherEnabledTabIds(settings)))();

  const getFieldError = (fieldId: string): string | undefined =>
    errors[fieldId] || errors[`custom:${fieldId}`];

  /** FormModal error banner — deduped field validation messages (Students parity). */
  const validationErrorSummary = (() => {
    const messages = Object.values(errors).filter((message) => Boolean(message));
    const reasonMessage = typedDuplicateReason
      ? t(DUPLICATE_ERROR_KEYS[typedDuplicateReason])
      : "";
    if (reasonMessage) messages.push(reasonMessage);
    return messages.length > 0 ? [...new Set(messages)] : undefined;
  })();

  const { data: linkedContact } = useContactById(
    teacherDraft.contactId ? String(teacherDraft.contactId) : undefined,
    !!teacherDraft.contactId,
  );

  useEffect(() => {
    if (!linkedContact) return;
    const qual = getContactQualification(linkedContact);
    const spec = getContactSpecialization(linkedContact);
    setTeacherDraft((prev) => {
      const nextQual = qual || prev.qualification || "";
      const nextSpec = spec || prev.specialization || "";
      if (prev.qualification === nextQual && prev.specialization === nextSpec) return prev;
      return { ...prev, qualification: nextQual, specialization: nextSpec };
    });
  }, [linkedContact]);

  const { data: linkedTeacherContactIds = [] } = useTeacherLinkedContactIds(
    teacher?.id ? String(teacher.id) : undefined,
  );

  const {
    data: nextEmployeeId,
    refetch: refetchNextEmployeeId,
    isFetching: isFetchingNextEmployeeId,
  } = useTeacherNextEmployeeId({
    prefix: idPrefix,
    template: settings.idTemplate,
    digits: settings.idDigits,
    startSeq: settings.idStartSeq,
    restartAnnually: settings.idRestartAnnually,
    enabled: !teacher?.id && autoGenerateId,
  });

  const handleRegenerateEmployeeId = useCallback(async () => {
    const res = await refetchNextEmployeeId();
    const nextId = extractEmployeeId(res.data);
    if (nextId) setTeacherDraft((prev) => ({ ...prev, employeeId: nextId }));
  }, [refetchNextEmployeeId]);

  useEffect(() => {
    if (teacher?.id || !autoGenerateId) return;
    const resolved = extractEmployeeId(nextEmployeeId);
    if (!resolved || teacherDraft.employeeId) return;
    setTeacherDraft((prev) => {
      if (prev.employeeId) return prev;
      const nextDraft = { ...prev, employeeId: resolved };
      setBaselineSnapshot(teacherDraftSnapshot(nextDraft));
      return nextDraft;
    });
  }, [nextEmployeeId, teacher?.id, teacherDraft.employeeId, autoGenerateId]);

  const usersQuery = useUsersContractList({ limit: 100 }, Boolean(teacherDraft.contactId));
  const existingUsers = (usersQuery.data as { users?: Array<{ id: string; contactId?: string | number; email?: string; role?: string; status?: string }> })?.users;

  const linkedUser = useMemo(() => {
    if (!teacherDraft.contactId && !teacherDraft.userId) return null;
    return existingUsers?.find(
      (u) =>
        (teacherDraft.userId && u.id === teacherDraft.userId) ||
        (teacherDraft.contactId && String(u.contactId) === String(teacherDraft.contactId)),
    ) ?? null;
  }, [existingUsers, teacherDraft.contactId, teacherDraft.userId]);

  const clearDuplicatePrompt = () => {
    setDuplicateConfirmOpen(false);
    setTypedDuplicateReason(null);
    setPendingSaveData(null);
  };

  const handleDuplicateDialogOpenChange = (open: boolean) =>
    open ? setDuplicateConfirmOpen(true) : clearDuplicatePrompt();

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
      onBaselineReset: (payload) => {
        setBaselineSnapshot(teacherDraftSnapshot(payload));
      },
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
    t,
    dir,
    language,
    saving,
    errors,
    teacherDraft,
    isDirty,
    defaultSpecialization,
    specializationOptions,
    designationOptions,
    handleUpdateDesignations,
    statusOptions,
    statusConfig,
    autoGenerateId,
    requireContactLink,
    fieldsMap,
    linkedContact,
    linkedTeacherContactIds,
    linkedUser,
    userAccountDraft,
    setUserAccountDraft,
    idPrefix,
    nextEmployeeId,
    handleRegenerateEmployeeId,
    isFetchingNextEmployeeId,
    formInstanceId,
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

export const useFacultyFormController = useTeacherFormController;
