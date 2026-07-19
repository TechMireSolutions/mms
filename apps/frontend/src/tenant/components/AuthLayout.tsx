import React, { useEffect, useMemo } from "react";
import {
  DEFAULT_BRANDING_SETTINGS,
  type PublicBranding,
  getInitials,
} from "@mms/shared";
import { useTenant } from "@/lib/contexts/TenantContext";
import { applyTenantEntryTheme } from "@/lib/brandingThemeCore";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTenantBranding } from "@/tenant/hooks/useTenantBranding";
import AuthLoadingShell from "@/components/entry/AuthLoadingShell";
import { cn } from "@/lib/utils";

export interface AuthLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Centered layout for pre-authenticated auth screens (login, 2FA, forgot password).
 * Uses server public branding — no localStorage db reads on the entry path.
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps): React.JSX.Element {
  const { t } = useTranslation();
  const { ready: brandingReady } = useTenantBranding();
  const { workspace, publicBranding } = useTenant();
  const reducedMotion = useReducedMotion();

  const displayName =
    publicBranding?.madrasaName.trim() ||
    workspace?.madrasaName.trim() ||
    t("entry.productName");
  const displayTagline = publicBranding?.tagline.trim() || workspace?.tagline?.trim() || "";
  const logoUrl = publicBranding?.logoUrl.trim() || "";

  const entryBranding = useMemo((): PublicBranding | null => {
    if (publicBranding) {
      return publicBranding;
    }
    if (!workspace?.madrasaName) {
      return null;
    }
    return {
      madrasaName: workspace.madrasaName,
      tagline: workspace.tagline ?? "",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: DEFAULT_BRANDING_SETTINGS.primaryColor,
      secondaryColor: DEFAULT_BRANDING_SETTINGS.secondaryColor,
    };
  }, [publicBranding, workspace]);

  useEffect(() => {
    if (!brandingReady || !entryBranding) {
      return;
    }
    applyTenantEntryTheme(entryBranding);
    if (displayName) {
      document.title = `${displayName} - Madrasa MS`;
    }
    const favicon = entryBranding.faviconUrl || entryBranding.logoUrl;
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [brandingReady, entryBranding, displayName]);

  if (!brandingReady) {
    return <AuthLoadingShell />;
  }

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-[420px]",
          !reducedMotion && "animate-fade-in",
        )}
      >
        <div className="relative overflow-hidden group/auth rounded-2xl border border-border/60 bg-card/80 shadow-xl shadow-black/[0.04] backdrop-blur-xl dark:shadow-black/20">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/auth:bg-primary" />
          <div className="border-b border-border/50 bg-muted/15 px-6 py-6 text-center sm:px-8 pl-7.5">
            <div className="mb-4 flex flex-col items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`h-16 w-16 rounded-2xl shadow-surface ${LOGO_IMAGE}`}
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm"
                  role="img"
                  aria-label={displayName}
                >
                  <span className="font-display text-2xl font-bold text-primary" aria-hidden>
                    {getInitials(displayName, 1)}
                  </span>
                </div>
              )}
              <p className="text-base font-semibold text-foreground">{displayName}</p>
              {displayTagline ? (
                <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  {displayTagline}
                </p>
              ) : null}
            </div>

            {title ? (
              <div className="space-y-1 border-t border-border/40 pt-4">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7 pl-7 sm:pl-9">{children}</div>
        </div>
      </div>
    </main>
  );
}
