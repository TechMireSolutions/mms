import React from "react";
import { PageHeader, type PageHeaderProps } from "@/components/ui/PageHeader";

interface ModulePageShellProps {
  seoTitle: string;
  seoDescription: string;
  headerIcon?: PageHeaderProps["icon"];
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: PageHeaderProps["actions"];
  metricsStrip?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * ModulePageShell — DRY top-level layout wrapper for all module pages.
 * Handles SEO metadata, standardized page header formatting, metrics banner alignment,
 * and responsive grid spacing.
 */
export function ModulePageShell({
  seoTitle,
  seoDescription,
  headerIcon,
  headerTitle,
  headerSubtitle,
  headerActions,
  metricsStrip,
  children,
}: ModulePageShellProps): React.JSX.Element {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <PageHeader
        icon={headerIcon}
        title={headerTitle}
        subtitle={headerSubtitle}
        actions={headerActions}
      />
      {metricsStrip}
      {children}
    </div>
  );
}
