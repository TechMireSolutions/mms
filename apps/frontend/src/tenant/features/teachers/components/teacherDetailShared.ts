import {
  Briefcase,
  Calendar,
  GraduationCap,
  Hash,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  type TeachersSettings,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

export const SYSTEM_FIELD_ICONS: Record<string, LucideIcon> = {
  contactId: User,
  employeeId: Hash,
  specialization: Briefcase,
  qualification: GraduationCap,
  joinDate: Calendar,
  status: Briefcase,
};

/** Resolve a tab key to its translated section title (Students grouped-fields parity). */
export function resolveTeacherTabLabel(
  settings: TeachersSettings,
  tabId: string,
  t: TranslationFunction,
): string {
  const tabs = settings.formTabs && settings.formTabs.length > 0
    ? settings.formTabs
    : TEACHERS_TAB_REGISTRY;
  const tab = tabs.find((candidate) => candidate.key === tabId);
  if (!tab) return tabId;
  return resolveRegistryLabel({ label: tab.label, labelKey: tab.labelKey }, t);
}
