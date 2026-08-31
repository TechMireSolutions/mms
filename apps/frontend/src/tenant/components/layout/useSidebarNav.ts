import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { NAV_ITEMS, type NavItem } from "@/lib/config/navConfig";
import { isNavPathActive } from "@/lib/config/routes";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import type { Permission } from "@mms/shared";

function canShowNavItem(
  item: Pick<NavItem, 'moduleId' | 'requiredPermission'>,
  enabledModules: Record<string, boolean>,
  can: (permission: Permission) => boolean,
): boolean {
  const moduleEnabled = !item.moduleId || enabledModules[item.moduleId] !== false;
  const permissionGranted = !item.requiredPermission || can(item.requiredPermission);
  return moduleEnabled && permissionGranted;
}

export function filterSidebarNavItems(
  items: readonly NavItem[],
  enabledModules: Record<string, boolean>,
  can: (permission: Permission) => boolean,
): NavItem[] {
  return items
    .map((item) => {
      if (!item.subItems) return item;
      const subItems = item.subItems.filter((subItem) =>
        canShowNavItem(subItem, enabledModules, can),
      );
      return { ...item, subItems };
    })
    .filter((item) =>
      item.subItems
        ? item.subItems.length > 0
        : canShowNavItem(item, enabledModules, can),
    );
}

export function useSidebarNav(collapsed: boolean, onToggle: () => void) {
  const location = useLocation();
  const settings = useGlobalSettings();
  const enabledModules = settings.enabledModules || {};
  const { can } = usePermissions();

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

  const visibleMenuItems = filterSidebarNavItems(NAV_ITEMS, enabledModules, can);

  return {
    location,
    openMenus,
    toggleMenu,
    visibleMenuItems,
  };
}
