import type { TeachersSettings } from "@mms/shared";

export const TEACHER_CONFIG_COLLECTION_KEYS = {
  statuses: "teacherStatuses",
  specializations: "teacherSpecializations",
} as const;

export interface TeacherConfigDefaults {
  statuses: string[];
  specializations: string[];
  settings: TeachersSettings;
}

export function getTeacherConfigCollectionDefaults(): Pick<TeacherConfigDefaults, "statuses" | "specializations"> {
  return {
    statuses: [],
    specializations: [],
  };
}
