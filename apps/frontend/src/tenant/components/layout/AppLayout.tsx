import React, { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ModuleScaffoldSkeleton } from "@/components/common/ModuleScaffold";
import { AppShell } from "@/components/common/AppShell";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/ui/AppFooter";
import Sidebar from "@/tenant/components/layout/Sidebar";
import TopBar from "@/tenant/components/layout/TopBar";
import TopBarActions from "@/tenant/components/layout/TopBarActions";
import MobileSidebar from "@/tenant/components/layout/MobileSidebar";
const CommandPalette = React.lazy(() =>
  import("@/components/ui/CommandPalette").then((m) => ({ default: m.CommandPalette }))
);
import { useBranding } from "@/tenant/hooks/useBranding";
import { getInitials } from "@mms/shared";
import { useSessionTimeout } from "@/tenant/hooks/useSessionTimeout";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useInitializeUiState } from "@/tenant/hooks/useInitializeUiState";

/**
 * Main authenticated application shell layout. Orchestrates the primary sidebar,
 * top navigation bar, mobile-responsive layouts, and wraps nested router views.
 */
export default function AppLayout(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const branding = useBranding();
  const { t } = useTranslation();
  const sessionTimeoutModal = useSessionTimeout();
  useInitializeUiState();

  useGlobalShortcut("k", () => setCommandPaletteOpen((prev) => !prev));

  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    setLogoError(false);
  }, [branding.logoUrl]);

  return (
    <AppShell
      sidebar={
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      }
      mobileSidebar={
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      }
      topBar={
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
      }
      mobileHeader={
        <div className="flex h-14 w-full items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md">
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
            {branding.logoUrl && !logoError ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className={`h-7 w-7 max-w-full shrink-0 rounded-md ${LOGO_IMAGE}`}
                width={28}
                height={28}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <span className="font-display text-sm font-bold text-primary">
                  {branding.madrasaName ? getInitials(branding.madrasaName, 1) : "م"}
                </span>
              </div>
            )}
            <span className="min-w-0 truncate text-sm font-semibold">
              {branding.madrasaName || t("entry.productName")}
            </span>
          </div>
          <TopBarActions compact onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        </div>
      }
      commandPalette={
        commandPaletteOpen ? (
          <Suspense fallback={null}>
            <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
          </Suspense>
        ) : null
      }
      extraModals={sessionTimeoutModal}
      sidebarCollapsed={sidebarCollapsed}
      footer={<AppFooter text={branding.footerText || undefined} name={branding.madrasaName || undefined} />}
    >
      <Suspense fallback={<ModuleScaffoldSkeleton />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

