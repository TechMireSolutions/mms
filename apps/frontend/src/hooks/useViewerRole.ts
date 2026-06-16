import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export type ViewerRole = "admin" | "teacher" | "accountant";
export type EnrollmentViewerRole = "admin" | "staff" | "accountant";

/** Maps authenticated user.role to the standard viewer role used across module pages. */
export function normalizeViewerRole(role: string | undefined): ViewerRole {
  const normalized = (role ?? "admin").toLowerCase();
  if (normalized === "teacher" || normalized === "staff") return "teacher";
  if (normalized === "accountant") return "accountant";
  return "admin";
}

/** Enrollments module labels non-admin staff as `staff` instead of `teacher`. */
export function normalizeEnrollmentViewerRole(role: string | undefined): EnrollmentViewerRole {
  const normalized = normalizeViewerRole(role);
  if (normalized === "teacher") return "staff";
  return normalized;
}

/** Active viewer role from the signed-in session — no preview override. */
export function useViewerRole(): ViewerRole {
  const { user } = useAuth();
  return useMemo(() => normalizeViewerRole(user?.role), [user?.role]);
}

/** Whether the signed-in viewer has admin privileges (gates Users config/analytics). */
export function useIsAdminViewer(): boolean {
  return useViewerRole() === "admin";
}

export function useEnrollmentViewerRole(): EnrollmentViewerRole {
  const { user } = useAuth();
  return useMemo(() => normalizeEnrollmentViewerRole(user?.role), [user?.role]);
}
