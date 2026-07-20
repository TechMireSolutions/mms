import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useBranding } from "@/tenant/hooks/useBranding";
import { getInitials } from "@mms/shared";

import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { NAV_ITEMS } from "@/lib/config/navConfig";
import { isNavPathActive, ROUTES } from "@/lib/config/routes";
import { prefetchRoute } from "@/lib/routing/routePrefetch";
import { LOGO_IMAGE } from "@/lib/semanticTone";

export interface SidebarProps {
  /** If true, shrinks the sidebar to an icon-only strip. */
  collapsed: boolean;
  /** Triggered when the user clicks the collapse/expand toggle button. */
  onToggle: () => void;
}

/**
 * Main application navigation sidebar for desktop screens. Shows brand logo and standard
 * routes list, with expandable/collapsible width and active route layout animation.
 */
export default function Sidebar({ collapsed, onToggle }: SidebarProps): React.JSX.Element {
  const location = useLocation();
  const branding = useBranding();

  const settings = useGlobalSettings();
  const { t, isRtl } = useTranslation();
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

  return (
    <aside
      className={`fixed top-0 h-screen bg-sidebar z-40 flex flex-col transition-all duration-300 ease-in-out ${
        isRtl ? "right-0" : "left-0"
      } ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <Link to={ROUTES.home} className="flex items-center gap-3 overflow-hidden min-w-0 hover:opacity-90 transition-opacity">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className={`h-8 w-8 shrink-0 rounded-lg ${LOGO_IMAGE} border-sidebar-border`}
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-display text-lg font-bold">
                {branding.madrasaName ? getInitials(branding.madrasaName, 1) : "م"}
              </span>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sidebar-foreground font-semibold text-sm tracking-wide">
                  {branding.madrasaName || "Madrasa MS"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          if (item.subItems) {
            const isMenuOpen = !!openMenus[item.labelKey];
            const hasActiveSub = item.subItems.some(sub => isNavPathActive(location.pathname, sub.path));
            const Icon = item.icon;

            return (
              <div key={item.labelKey} className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMenu(item.labelKey)}
                  className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 relative h-auto hover:bg-sidebar-accent/50 ${
                    hasActiveSub
                      ? "bg-sidebar-accent/35 text-sidebar-foreground"
                      : "text-sidebar-muted-foreground hover:text-sidebar-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${hasActiveSub ? "text-sidebar-primary" : ""}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
                        >
                          {t(item.labelKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-90 text-sidebar-foreground" : "text-sidebar-muted-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                  )}
                </Button>

                <AnimatePresence initial={false}>
                  {isMenuOpen && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden pl-7 space-y-1 border-l border-sidebar-border/40 ml-[21px]"
                    >
                      {item.subItems.map((sub) => {
                        const isSubActive = isNavPathActive(location.pathname, sub.path);
                        const SubIcon = sub.icon;

                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onMouseEnter={() => prefetchRoute(sub.path)}
                            onFocus={() => prefetchRoute(sub.path)}
                            className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                              isSubActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`}
                          >
                            {isSubActive && (
                              <motion.div
                                layoutId="sidebar-indicator-sub"
                                className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-sidebar-primary rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? "text-sidebar-primary" : ""}`} />
                            <span className="text-[12.5px] font-medium">
                              {t(sub.labelKey)}
                            </span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const isActive = isNavPathActive(location.pathname, item.path ?? ROUTES.home);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path!}
              onMouseEnter={() => prefetchRoute(item.path!)}
              onFocus={() => prefetchRoute(item.path!)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                isActive ? "text-sidebar-primary" : ""
              }`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
                  >
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors h-auto"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">{t("nav.collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
