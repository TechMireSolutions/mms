import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";

const TEACHER_LOCKED_ENABLED_TABS = ["basic"] as const;

function withTeacherLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const next = new Set(
    [...tabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of TEACHER_LOCKED_ENABLED_TABS) {
    next.add(locked);
  }
  return [...next].sort();
}

function isTeacherLockedEnabledTab(tabKey: string): boolean {
  return TEACHER_LOCKED_ENABLED_TABS.includes(
    tabKey.toLowerCase() as (typeof TEACHER_LOCKED_ENABLED_TABS)[number],
  );
}

/** Canonical Setup Fields dirty snapshot for Teachers. */
export const teachersFieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withTeacherLockedEnabledTabs,
  isLockedTab: isTeacherLockedEnabledTab,
});
