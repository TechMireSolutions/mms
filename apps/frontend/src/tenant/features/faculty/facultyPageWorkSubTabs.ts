import type { LucideIcon } from "lucide-react";
import { Award, Building2, Users } from "lucide-react";

export const FACULTY_WORK_SUB_TAB_IDS = ["faculties", "departments", "designations"] as const;
export type FacultyWorkSubTabId = (typeof FACULTY_WORK_SUB_TAB_IDS)[number];

export const FACULTY_WORK_SUB_TAB_DEFAULT: FacultyWorkSubTabId = "faculties";

export const FACULTY_WORK_SUB_TAB_KEYS: Record<
  FacultyWorkSubTabId,
  "faculty.tabs.faculties" | "faculty.tabs.departments" | "faculty.tabs.designations"
> = {
  faculties: "faculty.tabs.faculties",
  departments: "faculty.tabs.departments",
  designations: "faculty.tabs.designations",
};

export const FACULTY_WORK_SUB_TAB_ICONS: Record<FacultyWorkSubTabId, LucideIcon> = {
  faculties: Users,
  departments: Building2,
  designations: Award,
};

export function resolveFacultyWorkSubTab(value: string): FacultyWorkSubTabId {
  return (FACULTY_WORK_SUB_TAB_IDS as readonly string[]).includes(value)
    ? (value as FacultyWorkSubTabId)
    : FACULTY_WORK_SUB_TAB_DEFAULT;
}
