import {
  isStudentLockedEnabledTab,
  STUDENT_LOCKED_ENABLED_TABS,
} from "@mms/shared";
import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";

function withStudentLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const next = new Set(
    [...tabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of STUDENT_LOCKED_ENABLED_TABS) {
    next.add(locked);
  }
  return [...next].sort();
}

/** Canonical Setup Fields dirty snapshot for Students (Contacts-shaped). */
export const studentsFieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withStudentLockedEnabledTabs,
  isLockedTab: isStudentLockedEnabledTab,
});
