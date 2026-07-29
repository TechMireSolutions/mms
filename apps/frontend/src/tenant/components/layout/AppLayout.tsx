import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/tenant/components/layout/Sidebar";
import TopBar from "@/tenant/components/layout/TopBar";
import TopBarActions from "@/tenant/components/layout/TopBarActions";
import MobileSidebar from "@/tenant/components/layout/MobileSidebar";
import { useBranding } from "@/tenant/hooks/useBranding";
import { getInitials } from "@mms/shared";
import { useSessionTimeout } from "@/tenant/hooks/useSessionTimeout";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/**
 * Main authenticated application shell layout. Orchestrates the primary sidebar,
 * top navigation bar, mobile-responsive layouts, and wraps nested router views.
 */
export default function AppLayout(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const branding = useBranding();
  const { t } = useTranslation();
  useSessionTimeout();

  return (
    <div className="box-border min-h-screen w-full max-w-full overflow-x-hidden bg-background islamic-pattern">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Top Bar */}
      <div className="hidden lg:block">
        <TopBar sidebarCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden surface-glass fixed top-0 inset-x-0 z-40 flex h-14 items-center gap-2 px-3 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("nav.openMenu")}
          onClick={(event) => {
            event.stopPropagation();
            setMobileOpen(true);
          }}
          className="shrink-0 rounded-lg transition-colors hover:bg-muted"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className={`h-7 w-7 max-w-full shrink-0 rounded-md ${LOGO_IMAGE}`}
              width={28}
              height={28}
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <span className="font-display text-sm font-bold text-primary">
                {branding.madrasaName ? getInitials(branding.madrasaName, 1) : "م"}
              </span>
            </div>
          )}
          <span className="truncate text-sm font-semibold">
            {branding.madrasaName || t("entry.productName")}
          </span>
        </div>
        <TopBarActions compact />
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          "flex min-h-screen min-w-0 max-w-full flex-col pt-14 transition-all duration-300 lg:pt-16",
          sidebarCollapsed ? "lg:ps-[4.5rem]" : "lg:ps-[16.25rem]",
        )}
      >
        <div className="min-w-0 max-w-full flex-grow p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
        <footer className="border-t border-border/50 bg-card/20 px-4 py-3 text-center text-xs font-semibold text-muted-foreground select-none sm:px-6">
          {branding.footerText || t("theme.footerDefault", {
            year: new Date().getFullYear(),
            name: branding.madrasaName || t("entry.productName"),
          })}
        </footer>
      </main>
    </div>
  );
}
