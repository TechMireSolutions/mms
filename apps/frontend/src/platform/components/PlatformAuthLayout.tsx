import React from "react";
import { PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface PlatformAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/** Apex platform auth shell — single logo, no tenant branding block. */
export default function PlatformAuthLayout({
  children,
  title,
  subtitle,
}: PlatformAuthLayoutProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { dir } = useTranslation();

  return (
    <main
      id="main-content"
      dir={dir}
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
          <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/auth:bg-primary" />
          <div className="border-b border-border/50 bg-muted/15 px-6 py-6 text-center sm:px-8 ps-7.5">
            <PlatformLogoMark />
            <div className="mt-4 space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7 ps-7 sm:ps-9">{children}</div>
        </div>
      </div>
    </main>
  );
}
