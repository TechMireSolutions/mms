import { getPrimaryPhone, hasWhatsApp, type Faculty, type Teacher } from "@mms/shared";
import { computeModuleMessagingSelectionTargets } from "@/lib/messaging/computeModuleMessagingSelectionTargets";

export interface FacultySelectionTargets {
  waTargets: Faculty[];
  smsReady: Faculty[];
  emailReady: Faculty[];
}
export type TeachersSelectionTargets = FacultySelectionTargets;

/** Pure eligibility for bulk messaging from current-page rows ∩ selected ids. */
export function computeFacultySelectionTargets({
  selectedIds,
  workFaculty,
  workTeachers,
}: {
  selectedIds: string[];
  workFaculty?: Faculty[];
  workTeachers?: Teacher[];
}): FacultySelectionTargets {
  const rows = workFaculty ?? workTeachers ?? [];
  return computeModuleMessagingSelectionTargets({
    selectedIds,
    rows,
    hasWhatsApp: (member) => hasWhatsApp({ phone: member.phone }),
    hasSms: (member) => Boolean(getPrimaryPhone({ phone: member.phone })),
    hasEmail: (member) => Boolean(member.email?.trim()),
  });
}

export const computeTeachersSelectionTargets = computeFacultySelectionTargets;

