import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronRight, LogOut } from "lucide-react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { NAV_ITEMS } from "@/lib/config/navConfig";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import { isNavPathActive, ROUTES } from "@/lib/config/routes";
import { prefetchRoute } from "@/lib/routing/routePrefetch";

export interface MobileSidebarProps {
  /** Boolean indicating if the mobile sidebar drawer is currently visible. */
  open: boolean;
  /** Callback triggered to close the mobile sidebar (e.g. clicking the backdrop, close button, or a link). */
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps): React.JSX.Element | null {
  const location = useLocation();
  const branding = useBranding();
  const { user, logout } = useAuth();
  const [openedAt, setOpenedAt] = useState<number>(0);

  const settings = useGlobalSettings();
  const { t } = useTranslation();
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
    setOpenMenus(prev => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => isNavPathActive(location.pathname, sub.path))) {
        setOpenMenus(prev => ({ ...prev, [item.labelKey]: true }));
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      setOpenedAt(Date.now());
    }
  }, [open]);

  if (!open) return null;

  const initials = user?.name
    ? user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "AK";

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
        onClick={() => {
          if (Date.now() - openedAt > 150) {
            onClose();
          }
        }}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-[280px] bg-sidebar z-50 lg:hidden shadow-2xl flex flex-col">
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className={`h-8 w-8 rounded-lg ${LOGO_IMAGE} border-sidebar-border`}
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display text-lg font-bold">
                  {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
                </span>
              </div>
            )}
            <span className="text-sidebar-foreground font-semibold text-sm">
              {branding.madrasaName || "Madrasa MS"}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 p-0 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="w-5 h-5" />
          </Button>
        </div>

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
                    className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 h-auto hover:bg-sidebar-accent/50 ${
                      hasActiveSub
                        ? "bg-sidebar-accent/30 text-sidebar-foreground"
                        : "text-sidebar-muted-foreground hover:text-sidebar-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${hasActiveSub ? "text-sidebar-primary" : ""}`} />
                      <span className="text-[13px] font-medium">{t(item.labelKey)}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMenuOpen ? "rotate-90 text-sidebar-foreground" : "text-sidebar-muted-foreground"
                      }`}
                    />
                  </Button>

                  <AnimatePresence initial={false}>
                    {isMenuOpen && (
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
                              onClick={onClose}
                              onMouseEnter={() => prefetchRoute(sub.path)}
                              onFocus={() => prefetchRoute(sub.path)}
                              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                                isSubActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                              }`}
                            >
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
                onClick={onClose}
                onMouseEnter={() => prefetchRoute(item.path!)}
                onFocus={() => prefetchRoute(item.path!)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-sidebar-primary" : ""}`} />
                <span className="text-[13px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-sidebar-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => {
              onClose();
              logout(true);
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
}
