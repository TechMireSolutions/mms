import React from "react";

interface PlatformPageShellProps {
  children: React.ReactNode;
  /** Max content width — default `lg` for console-style pages. */
  width?: "md" | "lg";
}

/** Shared apex platform page layout (LTR card shell). */
export default function PlatformPageShell({
  children,
  width = "lg",
}: PlatformPageShellProps): React.JSX.Element {
  const maxClass = width === "md" ? "max-w-md" : "max-w-lg";

  return (
    <div
      dir="ltr"
      className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className={`w-full ${maxClass} mx-auto`}>{children}</div>
    </div>
  );
}

export function PlatformLogoMark(): React.JSX.Element {
  return (
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
      <span className="text-primary font-display text-2xl font-bold" aria-hidden="true">
        م
      </span>
    </div>
  );
}
