import { LayoutDashboard, BarChart2, Settings, type LucideIcon } from "lucide-react";
import type { ModuleTierTabId } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

export interface ModuleTierTab {
  id: ModuleTierTabId;
  label: string;
  description: string;
  icon: LucideIcon;
}

import { useMemo } from "react";

export interface FilterTabsOptions {
  canViewSetup?: boolean;
  canViewReports?: boolean;
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

/**
 * Encapsulates the tier tab visibility logic for standard module pages.
 */
export function useFilteredModuleTierTabs(options: FilterTabsOptions): ModuleTierTab[] {
  const tabs = useModuleTierTabs();
  const canViewSetup = options.canViewSetup ?? true;
  const canViewReports = options.canViewReports ?? true;

  return useMemo(() => {
    return tabs.filter((tab) => {
      if (tab.id === "setup") return canViewSetup;
      if (tab.id === "reports") return canViewReports;
      return true;
    });
  }, [tabs, canViewSetup, canViewReports]);
}

