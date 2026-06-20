import React from "react";
import { motion } from "framer-motion";
import useBranding from "@/hooks/useBranding";
import { LOGO_IMAGE } from "@/lib/semanticTone";
import useTenantBranding from "@/hooks/useTenantBranding";
import useTranslation from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import AuthLoadingShell from "@/components/entry/AuthLoadingShell";

export interface AuthLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Centered layout for pre-authenticated auth screens (login, 2FA, forgot password).
 * On tenant hosts, shows a skeleton shell until public branding is ready.
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps): React.JSX.Element {
  const { t } = useTranslation();
  const { ready: brandingReady } = useTenantBranding();
  const branding = useBranding();
  const reducedMotion = useReducedMotion();
  const displayName = branding.madrasaName.trim() || t("entry.productName");
  const displayTagline = branding.tagline.trim();

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

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-xl shadow-black/[0.04] backdrop-blur-xl dark:shadow-black/20">
          <div className="border-b border-border/50 bg-muted/15 px-6 py-6 text-center sm:px-8">
            <div className="mb-4 flex flex-col items-center gap-2">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
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
                    {displayName.charAt(0)}
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

          <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        </div>
      </motion.div>
    </main>
  );
}
