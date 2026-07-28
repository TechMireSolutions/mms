import React from "react";
import { PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { AuthCardShell, AuthPageFrame } from "@/components/entry/AuthPageShell";

export interface PlatformAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

/** Apex platform auth shell — product mark, no tenant branding block. */
export default function PlatformAuthLayout({
  children,
  title,
  subtitle,
  footer,
}: PlatformAuthLayoutProps): React.JSX.Element {
  return (
    <AuthPageFrame>
      <AuthCardShell
        footer={footer}
        header={
          <div className="space-y-4">
            <PlatformLogoMark />
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        }
      >
        {children}
      </AuthCardShell>
    </AuthPageFrame>
  );
}
