import { User, Briefcase, SlidersHorizontal } from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  isTeacherLockedEnabledTab,
  type AppTranslationKey,
  type TabDefinition,
} from "@mms/shared";

export type TeacherFormTabItem = {
  key: string;
  labelKey?: AppTranslationKey;
  icon: typeof User;
  label: string;
};

const FORM_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  employment: Briefcase,
};

/**
 * Build FormModal tabs from persisted Setup `formTabs` (includes user-created tabs).
 * Locked `basic` is always shown; other tabs must appear in `enabledTabIds`
 * (from {@link resolveTeacherEnabledTabIds}).
 */
export function resolveTeacherFormModalTabs(
  formTabs: TabDefinition[] | undefined,
  enabledTabIds: ReadonlySet<string>,
): TeacherFormTabItem[] {
  const source =
    formTabs && formTabs.length > 0
      ? formTabs
      : TEACHERS_TAB_REGISTRY;

  const sorted = source
    .slice()
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  return sorted
    .filter((tab) => {
      if (isTeacherLockedEnabledTab(tab.key)) return true;
      return enabledTabIds.has(tab.key);
    })
    .map((tab) => ({
      key: tab.key,
      labelKey: tab.labelKey as AppTranslationKey | undefined,
      label: tab.label,
      icon: FORM_TAB_ICONS[tab.key] ?? SlidersHorizontal,
    }));
}
