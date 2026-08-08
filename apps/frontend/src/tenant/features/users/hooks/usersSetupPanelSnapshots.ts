import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";

const USER_LOCKED_ENABLED_TABS = ["basic"] as const;

function withUserLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const next = new Set(
    [...tabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of USER_LOCKED_ENABLED_TABS) {
    next.add(locked);
  }
  return [...next].sort();
}

function isUserLockedEnabledTab(tabKey: string): boolean {
  return USER_LOCKED_ENABLED_TABS.includes(
    tabKey.toLowerCase() as (typeof USER_LOCKED_ENABLED_TABS)[number],
  );
}

/** Canonical Setup Fields dirty snapshot for Users. */
export const usersFieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withUserLockedEnabledTabs,
  isLockedTab: isUserLockedEnabledTab,
});
