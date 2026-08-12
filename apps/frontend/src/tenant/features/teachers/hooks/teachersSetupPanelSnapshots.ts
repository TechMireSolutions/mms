import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";
import {
  isTeacherLockedEnabledTab,
  TEACHER_LOCKED_ENABLED_TABS,
} from "@mms/shared";

function withTeacherLockedEnabledTabs(tabIds?: Iterable<string> | null): string[] {
  const next = new Set(
    Array.from(tabIds || [])
      .map((tabId) => String(tabId).toLowerCase())
      .filter(Boolean),
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
