import type { ComponentProps } from "react";
import type { TeachersWorkTier } from "@/tenant/features/teachers/components/TeachersWorkTier";
import {
  buildTeachersWorkTierProps,
  type TeachersWorkTierSource,
} from "@/tenant/features/teachers/hooks/teachersPageWorkTierProps";

export type TeachersPageTabPanelProps = {
  activeTab: string;
  workTierProps: ComponentProps<typeof TeachersWorkTier>;
};

/** Tab panel bag: active tier + Work props (Reports/Setup need no props today). */
export function useTeachersPageTabPanelProps(
  activeTab: string,
  workSource: TeachersWorkTierSource,
): TeachersPageTabPanelProps {
  return {
    activeTab,
    workTierProps: buildTeachersWorkTierProps(workSource),
  };
}
