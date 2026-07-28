import React from "react";
import { PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { AuthCardShell, AuthFormHeading, AuthPageFrame } from "@/components/entry";

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
            <AuthFormHeading title={title} subtitle={subtitle} />
          </div>
        }
      >
        {children}
      </AuthCardShell>
    </AuthPageFrame>
  );
}
