import { getPrimaryPhone, hasWhatsApp, type Teacher } from "@mms/shared";
import { computeModuleMessagingSelectionTargets } from "@/lib/messaging/computeModuleMessagingSelectionTargets";

export interface TeachersSelectionTargets {
  waTargets: Teacher[];
  smsReady: Teacher[];
  emailReady: Teacher[];
}

/** Pure eligibility for bulk messaging from current-page rows ∩ selected ids. */
export function computeTeachersSelectionTargets({
  selectedIds,
  workTeachers,
}: {
  selectedIds: string[];
  workTeachers: Teacher[];
}): TeachersSelectionTargets {
  return computeModuleMessagingSelectionTargets({
    selectedIds,
    rows: workTeachers,
    hasWhatsApp: (teacher) => hasWhatsApp({ phone: teacher.phone }),
    hasSms: (teacher) => Boolean(getPrimaryPhone({ phone: teacher.phone })),
    hasEmail: (teacher) => Boolean(teacher.email?.trim()),
  });
}
