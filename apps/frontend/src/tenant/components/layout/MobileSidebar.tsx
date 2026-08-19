import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { getInitials } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { NAV_ITEMS } from "@/lib/config/navConfig";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import { isNavPathActive } from "@/lib/config/routes";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";
import { MobileSidebarNavItems } from "@/tenant/components/layout/MobileSidebarNavItems";

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
  const drawerRef = useOverlayBehavior<HTMLDivElement>({ open, onClose });

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

  const initials = getInitials(user?.name, 2) || "AK";

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

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-modal bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={() => {
          if (Date.now() - openedAt > 150) {
            onClose();
          }
        }}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.openMenu")}
        className="fixed start-0 top-0 z-modal flex h-full w-sidebar-mobile max-w-[85vw] flex-col bg-sidebar shadow-2xl lg:hidden"
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className={`h-8 w-8 shrink-0 rounded-lg ${LOGO_IMAGE} border-sidebar-border`}
                width={32}
                height={32}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                <span className="font-display text-lg font-bold text-sidebar-primary-foreground">
                  {branding.madrasaName ? getInitials(branding.madrasaName, 1) : "م"}
                </span>
              </div>
            )}
            <span className="min-w-0 truncate text-sm font-semibold text-sidebar-foreground">
              {branding.madrasaName || t("entry.productName")}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-h-11 min-w-11 h-11 w-11 p-0 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <span className="sr-only">{t("nav.closeSidebar")}</span>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <MobileSidebarNavItems
            items={visibleMenuItems}
            openMenus={openMenus}
            onToggleMenu={toggleMenu}
            onClose={onClose}
          />
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
            {t("auth.signOut")}
          </Button>
        </div>
      </div>
    </>
  );
}
