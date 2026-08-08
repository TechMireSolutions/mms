import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";

const SESSION_LOCKED_ENABLED_TABS = ["basic"] as const;

function withSessionLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const next = new Set(
    [...tabIds].map((tabId) => tabId.toLowerCase()).filter(Boolean),
  );
  for (const locked of SESSION_LOCKED_ENABLED_TABS) {
    next.add(locked);
  }
  return [...next].sort();
}

function isSessionLockedEnabledTab(tabKey: string): boolean {
  return SESSION_LOCKED_ENABLED_TABS.includes(
    tabKey.toLowerCase() as (typeof SESSION_LOCKED_ENABLED_TABS)[number],
  );
}

/** Canonical Setup Fields dirty snapshot for Sessions. */
export const sessionsFieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withSessionLockedEnabledTabs,
  isLockedTab: isSessionLockedEnabledTab,
});
