import React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";

export function AuthPageBackdrop(): React.JSX.Element {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[18%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[8%] end-[8%] h-56 w-56 rounded-full bg-secondary/[0.06] blur-3xl"
        aria-hidden
      />
    </>
  );
}

export function AuthCardShell({
  header,
  children,
  footer,
  className,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-[26.25rem]",
        !reducedMotion && "animate-fade-in",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-xl shadow-black/[0.04] backdrop-blur-xl dark:shadow-black/25">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
        <div className="border-b border-border/50 bg-muted/10 px-6 py-6 text-center sm:px-8">
          {header}
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        {footer ? (
          <div className="border-t border-border/40 px-6 py-4 text-center sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Outer page frame for pre-auth screens (platform + tenant). */
export function AuthPageFrame({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { dir } = useTranslation();

  return (
    <main
      id="main-content"
      dir={dir}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6"
    >
      <AuthPageBackdrop />
      {children}
    </main>
  );
}
