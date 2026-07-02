import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TopBarActions from "./TopBarActions";
import MobileSidebar from "./MobileSidebar";
import { useBranding } from "@/hooks/useBranding";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { LOGO_IMAGE } from "@/lib/semanticTone";

/**
 * Main authenticated application shell layout. Orchestrates the primary sidebar,
 * top navigation bar, mobile-responsive layouts, and wraps nested router views.
 */
export default function AppLayout(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const branding = useBranding();
  useSessionTimeout();

  return (
    <div className="min-h-screen bg-background islamic-pattern">
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
      <div className="lg:hidden surface-glass fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-2 px-3 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          onClick={(event) => {
            event.stopPropagation();
            setMobileOpen(true);
          }}
          className="shrink-0 rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className={`h-7 w-7 shrink-0 rounded-md ${LOGO_IMAGE}`}
              width={28}
              height={28}
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <span className="font-display text-sm font-bold text-primary">
                {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
              </span>
            </div>
          )}
          <span className="truncate text-sm font-semibold">
            {branding.madrasaName || "Madrasa MS"}
          </span>
        </div>
        <TopBarActions compact />
      </div>

      {/* Main Content */}
      <main
        className={`pt-14 lg:pt-16 min-h-screen flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        <div className="flex-grow p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
        <footer className="py-3 px-6 border-t border-border/50 text-center text-[10.5px] font-semibold text-muted-foreground bg-card/20 select-none">
          {branding.footerText || "© 2026 MMS. All rights reserved."}
        </footer>
      </main>
    </div>
  );
}
