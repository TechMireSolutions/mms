import React from "react";
import { SkipToContentLink } from "@/components/ui/SkipToContentLink";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export interface NavigationAdapter {
  sidebar?: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  commandPalette?: React.ReactNode;
  extraModals?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface AppShellProps {
  adapter?: NavigationAdapter;
  sidebar?: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  commandPalette?: React.ReactNode;
  extraModals?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
  contentPadding?: boolean;
  maxWidthClass?: string;
  className?: string;
  /** BiDi direction — forwarded to the outermost shell div. Defaults to undefined (browser/inherited). */
  dir?: "ltr" | "rtl";
  /** BCP 47 language tag — forwarded to the outermost shell div for screen-reader announcements. */
  lang?: string;
  children: React.ReactNode;
}

/**
 * Universal AppShell Layout Primitive.
 *
 * Unifies the outer page frame, skip-to-content navigation, responsive drawer triggers,
 * header bars, footer, and main content landmark across both tenant and platform domains.
 */
export function AppShell({
  adapter,
  sidebar: propSidebar,
  mobileSidebar: propMobileSidebar,
  topBar: propTopBar,
  mobileHeader: propMobileHeader,
  commandPalette: propCommandPalette,
  extraModals: propExtraModals,
  footer: propFooter,
  sidebarCollapsed = false,
  contentPadding = true,
  maxWidthClass,
  className,
  dir,
  lang,
  children,
}: AppShellProps): React.JSX.Element {
  const sidebar = adapter?.sidebar ?? propSidebar;
  const mobileSidebar = adapter?.mobileSidebar ?? propMobileSidebar;
  const topBar = adapter?.topBar ?? propTopBar;
  const mobileHeader = adapter?.mobileHeader ?? propMobileHeader;
  const commandPalette = adapter?.commandPalette ?? propCommandPalette;
  const extraModals = adapter?.extraModals ?? propExtraModals;
  const footer = adapter?.footer ?? propFooter;

  const { t } = useTranslation();

  return (
    <div
      dir={dir}
      lang={lang}
      className="box-border min-h-screen w-full max-w-full overflow-x-hidden bg-background islamic-pattern selection:bg-primary/10 selection:text-primary"
    >
      <SkipToContentLink />

      {/* Desktop Navigation Sidebar */}
      {sidebar ? (
        <aside
          aria-label={t("nav.desktopNavigation")}
          className="hidden lg:block fixed inset-y-0 start-0 z-fixed"
        >
          {sidebar}
        </aside>
      ) : null}

      {/* Mobile Navigation Drawer */}
      {mobileSidebar}

      {/* Desktop Top Header Bar */}
      {topBar ? (
        <header role="banner" className="hidden lg:block fixed top-0 inset-x-0 z-sticky">
          {topBar}
        </header>
      ) : null}

      {/* Mobile Top Header Bar */}
      {mobileHeader ? (
        <header role="banner" className="lg:hidden sticky top-0 z-sticky">
          {mobileHeader}
        </header>
      ) : null}

      {/* Global Command Palette */}
      {commandPalette}

      {/* Context-Specific Modals (e.g., Session Timeout) */}
      {extraModals}

      {/* Main Content Area */}
      <main
        id="main-content"
        className={cn(
          "flex min-h-screen min-w-0 max-w-full flex-col transition-all duration-300",
          topBar || mobileHeader ? "pt-14 lg:pt-16" : "",
          sidebar
            ? sidebarCollapsed
              ? "lg:ps-sidebar-collapsed"
              : "lg:ps-sidebar"
            : "",
          className,
        )}
      >
        <div
          className={cn(
            "min-w-0 max-w-full flex-grow",
            contentPadding ? "p-4 md:p-6 lg:p-8" : "",
            maxWidthClass ? cn("mx-auto w-full", maxWidthClass) : "",
          )}
        >
          {children}
        </div>
        {footer}
      </main>
    </div>
  );
}
