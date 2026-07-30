import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { NAV_ITEMS } from "@/lib/config/navConfig";
import { isNavPathActive } from "@/lib/config/routes";

export function useSidebarNav(collapsed: boolean, onToggle: () => void) {
  const location = useLocation();
  const settings = useGlobalSettings();
  const enabledModules = settings.enabledModules || {};

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => isNavPathActive(location.pathname, sub.path))) {
        initial[item.labelKey] = true;
      }
    });
    return initial;
  });

  const toggleMenu = (labelKey: string) => {
    if (collapsed) {
      onToggle();
      setOpenMenus(prev => ({ ...prev, [labelKey]: true }));
    } else {
      setOpenMenus(prev => ({ ...prev, [labelKey]: !prev[labelKey] }));
    }
  };

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => isNavPathActive(location.pathname, sub.path))) {
        setOpenMenus(prev => ({ ...prev, [item.labelKey]: true }));
      }
    });
  }, [location.pathname]);

  const visibleMenuItems = NAV_ITEMS.map(item => {
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter(sub => {
        if (!sub.moduleId) return true;
        return enabledModules[sub.moduleId] !== false;
      });
      return { ...item, subItems: visibleSubItems };
    }
    return item;
  }).filter(item => {
    if (item.subItems) {
      return item.subItems.length > 0;
    }
    if (!item.moduleId) return true;
    return enabledModules[item.moduleId] !== false;
  });

  return {
    location,
    openMenus,
    toggleMenu,
    visibleMenuItems,
  };
}
