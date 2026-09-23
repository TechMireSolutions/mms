import { useEffect } from "react";
import type { Faculty, Teacher } from "@mms/shared";
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface FacultyFormHierarchySyncProps {
  teacherDraft: Partial<Teacher>;
  setTeacherDraft: React.Dispatch<React.SetStateAction<Partial<Teacher>>>;
  userAccountDraft: FacultyUserAccountDraft;
  setUserAccountDraft: React.Dispatch<React.SetStateAction<FacultyUserAccountDraft>>;
  supervisorCandidates: Faculty[];
}

/**
 * Synchronizes designation role restrictions and hierarchy rules:
 * 1. Adjusts userAccountDraft.role when designation restricts assignable roles.
 * 2. Clears reporting supervisor if hierarchy rank is 1 (top-level).
 * 3. Clears reporting supervisor if selected supervisor is no longer senior.
 */
export function useFacultyHierarchyFormSync({
  teacherDraft,
  setTeacherDraft,
  userAccountDraft,
  setUserAccountDraft,
  supervisorCandidates,
}: FacultyFormHierarchySyncProps): void {
  useEffect(() => {
    const allowedRoles = teacherDraft.designationAssignableRoles;
    if (allowedRoles && allowedRoles.length > 0 && userAccountDraft.role) {
      if (!allowedRoles.includes(userAccountDraft.role)) {
        setUserAccountDraft((prev) => ({
          ...prev,
          role: allowedRoles[0],
        }));
      }
    }
  }, [teacherDraft.designationAssignableRoles, userAccountDraft.role, setUserAccountDraft]);

  useEffect(() => {
    if (teacherDraft.hierarchyRank === 1 && teacherDraft.reportingFacultyId) {
      setTeacherDraft((prev) => ({
        ...prev,
        reportingFacultyId: null,
      }));
    }
  }, [teacherDraft.hierarchyRank, teacherDraft.reportingFacultyId, setTeacherDraft]);

  useEffect(() => {
    if (
      teacherDraft.reportingFacultyId &&
      supervisorCandidates.length > 0 &&
      !supervisorCandidates.some((c) => String(c.id) === String(teacherDraft.reportingFacultyId))
    ) {
      setTeacherDraft((prev) => ({
        ...prev,
        reportingFacultyId: null,
      }));
    }
  }, [supervisorCandidates, teacherDraft.reportingFacultyId, setTeacherDraft]);
}
