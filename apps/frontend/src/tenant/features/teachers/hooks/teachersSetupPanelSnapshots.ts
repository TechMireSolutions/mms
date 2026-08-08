import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";
import {
  isTeacherLockedEnabledTab,
  TEACHER_LOCKED_ENABLED_TABS,
} from "@mms/shared";

function withTeacherLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const next = new Set(
    [...tabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of TEACHER_LOCKED_ENABLED_TABS) {
    next.add(locked);
  }
  return [...next].sort();
}

/** Canonical Setup Fields dirty snapshot for Teachers. */
export const teachersFieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withTeacherLockedEnabledTabs,
  isLockedTab: isTeacherLockedEnabledTab,
});
