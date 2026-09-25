import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersContractList } from "@/tenant/hooks/collections/users";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { teacherStatusOptions } from "@/lib/faculty/facultyStatusUi";
import { useTeacherStatusConfig, useTeacherLookupOptions } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import { useFacultyDesignations } from "@/tenant/features/faculty/hooks/useFacultyDesignations";
import {
  type Faculty,
  DEFAULT_TEACHERS_SETTINGS,
  FACULTY_HIERARCHY_RANK_PRESETS,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
} from "@mms/shared";
import { useFacultyContractList } from "@/tenant/features/faculty/hooks/useFacultyTsrHooks";
import {
  filterSupervisorCandidates,
  type FacultyFormControllerOptions,
  type UseTeacherFormControllerOptions,
  type UseFacultyFormControllerOptions,
} from "@/tenant/features/faculty/components/facultyFormDraft";
import { DUPLICATE_ERROR_KEYS } from "@/tenant/features/faculty/components/facultyFormValidation";
import type { TeacherStatusOption } from "@/tenant/features/faculty/components/FacultyFormSections";
import { useFacultyHierarchyFormSync } from "@/tenant/features/faculty/components/useFacultyFormSync";
import { useFacultyDraftState } from "@/tenant/features/faculty/components/useFacultyDraftState";
import { useFacultyFormSaveActions } from "@/tenant/features/faculty/components/useFacultyFormSaveActions";

export type { FacultyFormControllerOptions, UseTeacherFormControllerOptions, UseFacultyFormControllerOptions };

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
  const { statusOptions: statusValues, specializationOptions } = useTeacherLookupOptions();
  const designationDefinitions = useFacultyDesignations();

  const defaultSpecialization = settings.defaultSpecialization || specializationOptions[0] || DEFAULT_TEACHERS_SETTINGS.defaultSpecialization;
  const idPrefix = settings.idPrefix || DEFAULT_TEACHERS_SETTINGS.idPrefix;
  const autoGenerateId = settings.autoGenerateId !== false;
  const requireContactLink = settings.requireContactLink !== false;
  const fieldsMap = resolveTeacherFieldsMapForColumnSync(settings.fields);
  const statusOptions = teacherStatusOptions(t, statusValues) as TeacherStatusOption[];
  const statusConfig = useTeacherStatusConfig();
  const formInstanceId = String(teacher?.id ?? "new");

  const {
    teacherDraft,
    setTeacherDraft,
    setBaselineSnapshot,
    updateDraft,
    isDirty,
    userAccountDraft,
    setUserAccountDraft,
    linkedContact,
    linkedTeacherContactIds,
    nextEmployeeId,
    isFetchingNextEmployeeId,
    handleRegenerateEmployeeId,
  } = useFacultyDraftState({
    teacher,
    defaultSpecialization,
    autoGenerateId,
    idPrefix,
    settings,
  });

  const enabledTabs = useMemo(() => new Set(resolveTeacherEnabledTabIds(settings)), [settings]);

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

  const facultyListQuery = useFacultyContractList({ limit: 100 });
  const allFaculty = ((facultyListQuery.data as { faculty?: Faculty[] })?.faculty ?? []) as Faculty[];

  const currentRank = typeof teacherDraft.hierarchyRank === "number" ? teacherDraft.hierarchyRank : 4;
  const currentId = teacher?.id ? String(teacher.id) : null;
  const supervisorCandidates = useMemo(
    () => filterSupervisorCandidates(allFaculty, currentId, currentRank),
    [allFaculty, currentId, currentRank],
  );

  useFacultyHierarchyFormSync({
    teacherDraft,
    setTeacherDraft,
    userAccountDraft,
    setUserAccountDraft,
    supervisorCandidates,
  });

  const {
    saving,
    errors,
    handleSave,
    confirmDuplicateSave,
    validationErrorSummary,
    pendingSaveData,
    typedDuplicateReason,
    duplicateConfirmOpen,
    clearDuplicatePrompt,
    handleDuplicateDialogOpenChange,
  } = useFacultyFormSaveActions({
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
  });

  const getFieldError = (fieldId: string): string | undefined =>
    errors[fieldId] || errors[`custom:${fieldId}`];

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
    designationOptions: designationDefinitions.data ?? [],
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
    supervisorCandidates,
    hierarchyRankPresets: FACULTY_HIERARCHY_RANK_PRESETS,
  };
}

export const useFacultyFormController = useTeacherFormController;
