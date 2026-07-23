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
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 overflow-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/[0.08] via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px] animate-pulse"
        style={{ animationDuration: "8s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-10 left-10 h-60 w-60 rounded-full bg-violet-500/5 blur-[80px]"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-[420px]",
          !reducedMotion && "animate-fade-in transition-all duration-300",
        )}
      >
        <div className="relative overflow-hidden group/auth rounded-3xl border border-border/50 bg-card/70 shadow-2xl shadow-primary/5 backdrop-blur-xl hover:border-primary/20 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80" />
          <div className="border-b border-border/40 bg-muted/10 px-6 py-8 text-center sm:px-8">
            <PlatformLogoMark />
            <div className="mt-4 space-y-1.5">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{title}</h1>
              {subtitle ? (
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
