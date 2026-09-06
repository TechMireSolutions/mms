import React from "react";
import { PageHeader, type PageHeaderProps } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs, type AccordionTabItem } from "@/components/ui/ResponsiveAccordionTabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton, StatsSkeleton } from "@/components/ui/LoadingState";
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

export interface ModuleScaffoldSkeletonProps {
  showHeader?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  showFilterBar?: boolean;
  className?: string;
}

/**
 * Structural layout skeleton matching the Universal 3-tier Module Scaffold.
 * Preserves header, metrics strip, tabs, filter bar, and table container dimensions
 * to eliminate Cumulative Layout Shift (CLS = 0) and avoid blank-canvas spinners.
 */
export function ModuleScaffoldSkeleton({
  showHeader = true,
  showMetrics = true,
  showTabs = true,
  showFilterBar = true,
  className,
}: ModuleScaffoldSkeletonProps = {}): React.JSX.Element {
  return (
    <div
      className={cn("box-border mx-auto w-full min-w-0 max-w-7xl space-y-5 animate-pulse", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading module content...</span>

      {/* PageHeader Skeleton */}
      {showHeader ? (
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div className="flex min-w-0 items-start gap-3">
            <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-primary/10" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      ) : null}

      {/* KPI Metrics Strip Skeleton */}
      {showMetrics ? <StatsSkeleton count={4} /> : null}

      {/* 3-Tier Tab Bar Skeleton */}
      {showTabs ? (
        <div className="flex gap-2 border-b border-border pb-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      ) : null}

      {/* Directory Search & Filter Bar Skeleton */}
      {showFilterBar ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      ) : null}

      {/* Main Content Table Skeleton */}
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
