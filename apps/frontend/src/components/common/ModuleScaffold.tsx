import React from "react";
import { PageHeader, type PageHeaderProps } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs, type AccordionTabItem } from "@/components/ui/ResponsiveAccordionTabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";

export interface ModuleScaffoldProps {
  seoTitle: string;
  seoDescription: string;
  headerIcon?: PageHeaderProps["icon"];
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: PageHeaderProps["actions"];
  metricsStrip?: React.ReactNode;
  tabs?: AccordionTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  panelIdPrefix?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Universal 3-tier Module Scaffold layout primitive.
 * Standardizes SEO metadata, PageHeader, metrics strip, 3-tier tab navigation,
 * and responsive container styling.
 */
export function ModuleScaffold({
  seoTitle,
  seoDescription,
  headerIcon,
  headerTitle,
  headerSubtitle,
  headerActions,
  metricsStrip,
  tabs,
  activeTab,
  onTabChange,
  panelIdPrefix = "module-tab",
  className,
  children,
}: ModuleScaffoldProps): React.JSX.Element {
  return (
    <ErrorBoundary>
      <div className={cn("box-border mx-auto w-full min-w-0 max-w-7xl space-y-5", className)}>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {headerTitle ? (
          <PageHeader
            icon={headerIcon}
            title={headerTitle}
            subtitle={headerSubtitle}
            actions={headerActions}
          />
        ) : null}
        {metricsStrip}
        {tabs && activeTab && onTabChange ? (
          <ResponsiveAccordionTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            panelIdPrefix={panelIdPrefix}
          >
            {children}
          </ResponsiveAccordionTabs>
        ) : (
          children
        )}
      </div>
    </ErrorBoundary>
  );
}
