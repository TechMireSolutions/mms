import type { ContactExperience } from "@mms/shared";

export function createEmptyExperience(
  defaultEmploymentType: string | undefined,
  employmentTypeOptions: string[],
): ContactExperience {
  return {
    title: "",
    organization: "",
    employmentType: defaultEmploymentType || employmentTypeOptions[0] || "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  };
}
