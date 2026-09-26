import type React from "react";
import type { FieldDefinition, Teacher } from "@mms/shared";

export type {
  TeacherSectionBaseProps,
  TeacherStatusOption,
  TeacherEmploymentSectionProps,
  FacultySectionBaseProps,
  FacultyStatusOption,
  FacultyEmploymentSectionProps,
} from "./FacultyEmploymentSection";

export {
  TeacherEmploymentSection,
  FacultyEmploymentSection,
} from "./FacultyEmploymentSection";

import {
  TeacherContactSection,
  type TeacherContactSectionProps,
} from "@/tenant/features/faculty/components/FacultyFormContactSection";

export {
  TeacherContactSection,
  type TeacherContactSectionProps,
};

export type FacultyContactSectionProps = TeacherContactSectionProps;
export const FacultyContactSection = TeacherContactSection;

/**
 * @deprecated Qualification and specialization are derived directly from the linked contact's profile.
 */
export interface TeacherBasicSectionProps {
  teacherDraft?: Partial<Teacher>;
  errors?: Record<string, string>;
  fields?: Record<string, FieldDefinition[]>;
  onDraftChange?: (patch: Partial<Teacher>) => void;
  isFieldEnabled?: (fieldId: string) => boolean;
  isFieldRequired?: (fieldId: string) => boolean;
  defaultSpecialization?: string;
  specializationOptions?: string[];
}

/**
 * @deprecated Retired in favor of contact-first education and skills resolution.
 */
export function TeacherBasicSection(_props: TeacherBasicSectionProps): React.JSX.Element | null {
  return null;
}

export type FacultyBasicSectionProps = TeacherBasicSectionProps;
export const FacultyBasicSection = TeacherBasicSection;
