import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A full-page loading spinner with the app's branding.
 */
export function PageLoader(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-display text-xl font-bold">م</span>
        </div>
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * A skeleton loader for card-based layouts.
 */
export function CardSkeleton({ count = 3, className = "" }: CardSkeletonProps): React.ReactElement {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}

interface StatsSkeletonProps {
  count?: number;
}

/**
 * A skeleton loader for dashboard stat grids.
 */
export function StatsSkeleton({ count = 4 }: StatsSkeletonProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

/**
 * A skeleton loader for data tables.
 */
export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded w-24" />
        ))}
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex gap-4 items-center">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Skeleton key={j} className="h-3.5 rounded flex-1 max-w-[140px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader matching Three-Tier Module layout to eliminate Cumulative Layout Shift (CLS).
 */
export function ModuleViewSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Module Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-[44px] w-36 rounded-xl" />
      </div>

      {/* KPI Stats Grid Skeleton */}
      <StatsSkeleton count={4} />

      {/* Main Content Table/Grid Skeleton */}
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
