import { LayoutDashboard, BarChart2, Settings, type LucideIcon } from "lucide-react";
import type { ModuleTierTabId } from "@mms/shared";
import { useTranslation } from "./useTranslation";

export interface ModuleTierTab {
  id: ModuleTierTabId;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Standard three-tier module page tabs with localized labels. */
export function useModuleTierTabs(): ModuleTierTab[] {
  const { t } = useTranslation();
  return [
    {
      id: "work",
      label: t("module.work"),
      description: t("module.workHint"),
      icon: LayoutDashboard,
    },
    {
      id: "reports",
      label: t("module.reports"),
      description: t("module.reportsHint"),
      icon: BarChart2,
    },
    {
      id: "setup",
      label: t("module.setup"),
      description: t("module.setupHint"),
      icon: Settings,
    },
  ];
}

export default useModuleTierTabs;
