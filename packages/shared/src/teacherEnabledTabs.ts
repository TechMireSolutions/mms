import type { TabDefinition } from './contactFieldSchemaTypes.js';
import {
  TEACHER_LOCKED_ENABLED_TABS,
  TEACHERS_TAB_REGISTRY,
} from './moduleFieldSetupPersons.js';

/** Default enabled tab ids from the Teachers tab registry seed. */
export function defaultTeacherEnabledTabIds(): string[] {
  return TEACHERS_TAB_REGISTRY.filter((tab) => tab.enabled !== false).map((tab) => tab.key);
}

export type TeacherEnabledTabsInput = {
  enabledTabs?: readonly string[] | null;
  formTabs?: readonly TabDefinition[] | null;
};

function withTeacherLockedEnabledTabs(tabIds: Iterable<string>): string[] {
  const set = new Set(
    [...tabIds].map((tabId) => tabId.trim()).filter(Boolean),
  );
  for (const locked of TEACHER_LOCKED_ENABLED_TABS) {
    set.add(locked);
  }
  return [...set];
}

/**
 * Resolves Teachers form / Setup / detail / export enabled tab ids.
 * When `formTabs` is non-empty, each tab's `enabled` flag is authoritative (Contacts-shaped).
 * Otherwise falls back to non-empty `enabledTabs`, then registry defaults.
 * Locked tabs ({@link TEACHER_LOCKED_ENABLED_TABS}) are always included.
 */
export function resolveTeacherEnabledTabIds(
  settings?: TeacherEnabledTabsInput | null,
): string[] {
  const formTabs = settings?.formTabs;
  if (formTabs && formTabs.length > 0) {
    const fromFormTabs = formTabs
      .filter((tab) => tab.enabled !== false)
      .map((tab) => tab.key);
    return withTeacherLockedEnabledTabs(fromFormTabs);
  }

  const enabledTabs = settings?.enabledTabs;
  const source =
    enabledTabs && enabledTabs.length > 0
      ? enabledTabs.filter((tabId) => Boolean(tabId?.trim()))
      : defaultTeacherEnabledTabIds();
  return withTeacherLockedEnabledTabs(source);
}
