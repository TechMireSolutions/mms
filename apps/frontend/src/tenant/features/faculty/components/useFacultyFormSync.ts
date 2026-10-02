import { useEffect } from "react";
import type { Faculty } from "@mms/shared";
import type { FacultyUserAccountDraft } from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface FacultyFormHierarchySyncProps {
  facultyDraft?: Partial<Faculty>;
  setFacultyDraft?: React.Dispatch<React.SetStateAction<Partial<Faculty>>>;
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
  facultyDraft,
  setFacultyDraft,
  userAccountDraft,
  setUserAccountDraft,
  supervisorCandidates,
}: FacultyFormHierarchySyncProps): void {
  const draft = facultyDraft ?? {};
  const setDraft = setFacultyDraft;

  useEffect(() => {
    const allowedRoles = draft.designationAssignableRoles;
    if (allowedRoles && allowedRoles.length > 0 && userAccountDraft.role) {
      if (!allowedRoles.includes(userAccountDraft.role)) {
        setUserAccountDraft((prev) => ({
          ...prev,
          role: allowedRoles[0],
        }));
      }
    }
  }, [draft.designationAssignableRoles, userAccountDraft.role, setUserAccountDraft]);

  useEffect(() => {
    if (!setDraft) return;
    if (draft.hierarchyRank === 1 && (draft.reportingFacultyId || draft.reportingRoleId)) {
      setDraft((prev) => ({
        ...prev,
        reportingFacultyId: null,
        reportingRoleId: null,
        reportingRole: null,
        reportingDesignationId: null,
      }));
    }
  }, [draft.hierarchyRank, draft.reportingFacultyId, draft.reportingRoleId, setDraft]);

  useEffect(() => {
    if (!setDraft) return;
    if (
      draft.designationId &&
      (draft.reportingRoleId === draft.designationId || draft.reportingDesignationId === draft.designationId)
    ) {
      setDraft((prev) => ({
        ...prev,
        reportingFacultyId: null,
        reportingRoleId: null,
        reportingRole: null,
        reportingDesignationId: null,
      }));
    }
  }, [draft.designationId, draft.reportingRoleId, draft.reportingDesignationId, setDraft]);

  useEffect(() => {
    if (!setDraft) return;
    if (
      draft.reportingFacultyId &&
      supervisorCandidates.length > 0 &&
      !supervisorCandidates.some((c) => String(c.id) === String(draft.reportingFacultyId))
    ) {
      setDraft((prev) => ({
        ...prev,
        reportingFacultyId: null,
      }));
    }
  }, [supervisorCandidates, draft.reportingFacultyId, setDraft]);
}
