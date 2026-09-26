import { useCallback, useEffect, useState } from "react";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/faculty/hooks/useFaculty";
import {
  type Teacher,
  type TeachersSettings,
  getContactQualification,
  getContactSpecialization,
} from "@mms/shared";
import {
  DEFAULT_USER_ACCOUNT_DRAFT,
  extractEmployeeId,
  getInitialTeacherDraft,
  teacherDraftSnapshot,
} from "@/tenant/features/faculty/components/facultyFormDraft";
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface UseFacultyDraftStateInput {
  teacher?: Teacher;
  defaultSpecialization: string;
  autoGenerateId: boolean;
  idPrefix: string;
  settings: TeachersSettings;
}

export function useFacultyDraftState({
  teacher,
  defaultSpecialization,
  autoGenerateId,
  idPrefix,
  settings,
}: UseFacultyDraftStateInput) {
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
    setUserAccountDraft(DEFAULT_USER_ACCOUNT_DRAFT);
  }, [teacher, defaultSpecialization]);

  const updateDraft = useCallback((patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const isDirty =
    teacherDraftSnapshot(teacherDraft) !== baselineSnapshot
    || userAccountDraft.enabled;

  const { data: linkedContact } = useContactById(
    teacherDraft.contactId ? String(teacherDraft.contactId) : undefined,
    Boolean(teacherDraft.contactId),
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

  return {
    teacherDraft,
    setTeacherDraft,
    baselineSnapshot,
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
  };
}
