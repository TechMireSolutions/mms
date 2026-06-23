import type { StudentsSettings } from "@mms/shared";

export const STUDENT_CONFIG_COLLECTION_KEYS = {
  statuses: "studentStatuses",
  genderFilters: "studentGenderFilters",
  discountTypes: "studentDiscountTypes",
} as const;

export const STUDENT_CONFIG_OBJECT_KEYS = {
  guardianContactDefaults: "studentGuardianContactDefaults",
} as const;

export interface StudentGuardianContactDefault {
  filterGender?: string;
  createGender?: string;
  lockGender?: boolean;
}

export type StudentGuardianContactDefaults = Record<string, StudentGuardianContactDefault>;

export interface StudentConfigDefaults {
  statuses: string[];
  genderFilters: string[];
  discountTypes: Array<{ id: string; label: string; pct: number }>;
  settings: StudentsSettings;
  guardianContactDefaults: StudentGuardianContactDefaults;
}

export function getStudentConfigCollectionDefaults(): Pick<StudentConfigDefaults, "statuses" | "genderFilters" | "discountTypes"> {
  return {
    statuses: [],
    genderFilters: [],
    discountTypes: [],
  };
}

export function getDefaultStudentGuardianContactDefaults(): StudentGuardianContactDefaults {
  return {};
}
