import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { SidebarBrand } from "@/tenant/components/layout/SidebarBrand";
import { SidebarNav } from "@/tenant/components/layout/SidebarNav";
import { useSidebarNav } from "@/tenant/components/layout/useSidebarNav";

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps): React.JSX.Element {
  const { t } = useTranslation();
  const { location, openMenus, toggleMenu, visibleMenuItems } = useSidebarNav(collapsed, onToggle);

  return (
    <aside
      className={cn(
        "fixed start-0 top-0 z-sidebar flex h-screen flex-col bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      <SidebarBrand collapsed={collapsed} />

      <SidebarNav
        collapsed={collapsed}
        locationPathname={location.pathname}
        visibleMenuItems={visibleMenuItems}
        openMenus={openMenus}
        onToggleMenu={toggleMenu}
      />

      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="text-xs font-medium">{t("nav.collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
