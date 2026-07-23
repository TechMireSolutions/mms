import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, Users, User, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlatformPageShellProps {
  children: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: "md" | "lg" | "xl" | "7xl";
}


/** Shared apex platform page layout (LTR/RTL card shell or wide dashboard). */
export function PlatformPageShell({
  children,
  width = "lg",
}: PlatformPageShellProps): React.JSX.Element {
  const { dir, t } = useTranslation();
  const { isPlatformAuthenticated, platformUser, platformLogout } = usePlatformAuth();
  const location = useLocation();

  const isSuperUser = platformUser?.role === "super_user";

  // Use a wider dashboard layout if authenticated
  const maxClass = isPlatformAuthenticated
    ? "max-w-7xl"
    : width === "md"
    ? "max-w-md"
    : width === "lg"
    ? "max-w-lg"
    : width === "xl"
    ? "max-w-xl"
    : "max-w-7xl";

  return (
    <div
      dir={dir}
      className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col selection:bg-primary/10 selection:text-primary"
    >
      {isPlatformAuthenticated ? (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <Link to={ROUTES.home} className="flex items-center gap-3.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/25 shadow-sm group-hover:scale-105 group-hover:shadow group-hover:border-primary/45 transition-all duration-300">
                <span className="font-display text-lg font-black text-primary transition-transform group-hover:rotate-6">م</span>
              </div>
              <div className="flex flex-col text-start">
                <span className="text-sm font-black tracking-wider uppercase text-foreground leading-none">
                  {t("entry.productName")}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                  {t("platform.consoleTitle")}
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Platform navigation">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  location.pathname === ROUTES.home
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                <Link to={ROUTES.home}>
                  <LayoutDashboard className="w-4 h-4 me-1.5" aria-hidden />
                  {t("platform.manageMadrasas")}
                </Link>
              </Button>

              {isSuperUser && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                    location.pathname === ROUTES.platformAdmins
                      ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}
                >
                  <Link to={ROUTES.platformAdmins}>
                    <Users className="w-4 h-4 me-1.5" aria-hidden />
                    {t("platform.manageAdmins")}
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  location.pathname === ROUTES.platformAccount
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                <Link to={ROUTES.platformAccount}>
                  <User className="w-4 h-4 me-1.5" aria-hidden />
                  {t("platform.myAccount")}
                </Link>
              </Button>
            </nav>

            {/* User profile & actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-end">
                <span className="text-xs font-black text-foreground">
                  {platformUser?.name}
                </span>
                <span className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground mt-0.5">
                  {isSuperUser ? (
                    <>
                      <ShieldAlert className="w-2.5 h-2.5 text-primary shrink-0" aria-hidden />
                      {t("platform.roleSuperUser")}
                    </>
                  ) : (
                    t("platform.roleAdmin")
                  )}
                </span>
              </div>

              <div className="h-8 w-px bg-border/60 hidden sm:block" />

              <Button
                variant="ghost"
                size="icon"
                onClick={platformLogout}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-105 active:scale-95 transition-all"
                title={t("platform.signOut")}
                aria-label={t("platform.signOut")}
              >
                <LogOut className="w-4 h-4" aria-hidden />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="md:hidden flex items-center justify-around border-t border-border/40 px-2 py-1 bg-card/60 backdrop-blur-sm">
            <Link
              to={ROUTES.home}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95",
                location.pathname === ROUTES.home
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden />
              {t("platform.manageMadrasas")}
            </Link>

            {isSuperUser && (
              <Link
                to={ROUTES.platformAdmins}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95",
                  location.pathname === ROUTES.platformAdmins
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-4 h-4" aria-hidden />
                {t("platform.manageAdmins")}
              </Link>
            )}

            <Link
              to={ROUTES.platformAccount}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95",
                location.pathname === ROUTES.platformAccount
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="w-4 h-4" aria-hidden />
              {t("platform.myAccount")}
            </Link>
          </div>
        </header>
      ) : null}

      <main className="flex-1 w-full flex flex-col justify-center py-8">
        <div className={cn("w-full mx-auto px-4 sm:px-6", maxClass)}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function PlatformLogoMark(): React.JSX.Element {
  return (
    <div
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-600 shadow-md shadow-primary/20 hover:scale-105 transition-all duration-300"
      aria-hidden
    >
      <span className="font-display text-2xl font-black text-white">م</span>
    </div>
  );
}
