import React, { type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { cn } from "@/lib/utils";

export type WorkQueuePriority = "urgent" | "high" | "normal" | "low";

const PRIORITY_BADGES: Record<WorkQueuePriority, { label: string; tone: BadgeTone }> = {
  urgent: { label: "Urgent", tone: "destructive" },
  high: { label: "High", tone: "warning" },
  normal: { label: "Normal", tone: "primary" },
  low: { label: "Low", tone: "muted" },
};

export interface WorkQueueItemStatus {
  label: string;
  tone?: BadgeTone;
}

export interface WorkQueueProps<TData extends { id: string | number }> {
  items: TData[];
  title?: string;
  description?: string;

  /** Resolves the display priority for an item. */
  priorityField?: (item: TData) => WorkQueuePriority | undefined;

  /** Resolves the display status for an item. */
  statusField?: (item: TData) => WorkQueueItemStatus | undefined;

  /** Resolves the primary title / heading for an item. */
  getItemTitle?: (item: TData) => React.ReactNode;

  /** Resolves secondary subtitle / description for an item. */
  getItemDescription?: (item: TData) => React.ReactNode;

  /** Optional custom rendering for item body, replacing the default title + description layout. */
  renderItemContent?: (item: TData, isSelected: boolean) => React.ReactNode;

  /** Trailing row actions / quick buttons for an item. */
  renderItemActions?: (item: TData) => React.ReactNode;

  /** Selection state and callbacks. */
  selection?: {
    selectedIds: Set<string | number> | Array<string | number>;
    onSelectOne: (id: string) => void;
    onSelectAll: () => void;
    allSelected: boolean;
    someSelected: boolean;
    selectAllAriaLabel?: string;
    selectItemAriaLabel?: (item: TData) => string;
  };

  /** Set of item IDs optimistically marked as removed / completed. */
  optimisticDeletedIds?: Set<string | number>;

  /** Custom empty state when there are zero items in the queue. */
  emptyState?: React.ReactNode;
  isLoading?: boolean;

  /** Header actions or filter slot rendered in the queue header. */
  headerActions?: React.ReactNode;

  /** Sticky header styling (default: true). */
  stickyHeader?: boolean;

  /** Footer counts summary. */
  footerCount?: {
    pageCountLabel?: string;
    selectedCountLabel?: string;
  };

  onItemClick?: (item: TData) => void;
  className?: string;
  containerClassName?: string;
  "aria-label"?: string;
}

/**
 * Universal WorkQueue primitive.
 * Standardizes operational task and workflow queues supporting item selection,
 * priority badges, status transitions, optimistic removal, and sticky queue headers.
 */
export function WorkQueue<TData extends { id: string | number }>({
  items,
  title,
  description,
  priorityField,
  statusField,
  getItemTitle,
  getItemDescription,
  renderItemContent,
  renderItemActions,
  selection,
  optimisticDeletedIds,
  emptyState,
  isLoading,
  headerActions,
  stickyHeader = true,
  footerCount,
  onItemClick,
  className,
  containerClassName,
  "aria-label": ariaLabel = "Operational work queue",
}: WorkQueueProps<TData>): JSX.Element {
  const rowMotion = useListRowMotion({ layout: "position", fade: true, duration: 0.12 });

  const selectedSet = React.useMemo(() => {
    if (!selection) return new Set<string | number>();
    return selection.selectedIds instanceof Set
      ? selection.selectedIds
      : new Set(selection.selectedIds);
  }, [selection]);

  const activeItems = React.useMemo(() => {
    if (!optimisticDeletedIds || optimisticDeletedIds.size === 0) return items;
    return items.filter((item) => !optimisticDeletedIds.has(item.id));
  }, [items, optimisticDeletedIds]);

  if (!isLoading && activeItems.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn("space-y-3", containerClassName)}
    >
      {/* Queue Header */}
      {(title || selection || headerActions) && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 px-1",
            stickyHeader && "sticky top-0 z-10 bg-background/95 backdrop-blur-xs",
          )}
        >
          <div className="flex items-center gap-3">
            {selection && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selection.allSelected ? true : selection.someSelected ? "indeterminate" : false}
                  onCheckedChange={() => selection.onSelectAll()}
                  aria-label={selection.selectAllAriaLabel ?? "Select all queue items"}
                  className="size-4"
                />
              </div>
            )}
            {title && (
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            )}
          </div>

          {headerActions && (
            <div className="flex items-center gap-2 ms-auto">{headerActions}</div>
          )}
        </div>
      )}

      {/* Queue Items Feed */}
      <ul role="list" className={cn("space-y-2", className)}>
        <AnimatePresence initial={false}>
          {activeItems.map((item) => {
            const idStr = String(item.id);
            const isSelected = selectedSet.has(item.id) || selectedSet.has(idStr);
            const priority = priorityField?.(item);
            const status = statusField?.(item);
            const itemTitle = getItemTitle?.(item);
            const itemDesc = getItemDescription?.(item);
            const selectAriaLabel = selection?.selectItemAriaLabel
              ? selection.selectItemAriaLabel(item)
              : `Select queue item ${idStr}`;

            return (
              <motion.li
                key={idStr}
                {...rowMotion}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3.5 transition-colors hover:bg-muted/40",
                  isSelected && "border-primary/50 bg-accent/15",
                  onItemClick && "cursor-pointer",
                )}
              >
                {/* Checkbox */}
                {selection && (
                  <div
                    className="flex shrink-0 items-center pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => selection.onSelectOne(idStr)}
                      aria-label={selectAriaLabel}
                      className="size-4"
                    />
                  </div>
                )}

                {/* Content Container */}
                <div className="min-w-0 flex-1 space-y-1">
                  {renderItemContent ? (
                    renderItemContent(item, isSelected)
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {itemTitle && (
                          <span className="text-sm font-medium text-foreground">{itemTitle}</span>
                        )}
                        {priority && (
                          <Badge
                            size="sm"
                            tone={PRIORITY_BADGES[priority].tone}
                            className="text-3xs"
                          >
                            {PRIORITY_BADGES[priority].label}
                          </Badge>
                        )}
                        {status && (
                          <Badge
                            size="sm"
                            tone={status.tone ?? "secondary"}
                            className="text-3xs"
                          >
                            {status.label}
                          </Badge>
                        )}
                      </div>
                      {itemDesc && (
                        <div className="text-xs text-muted-foreground">{itemDesc}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Trailing Actions */}
                {renderItemActions && (
                  <div
                    className="flex shrink-0 items-center gap-1.5 ms-2 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderItemActions(item)}
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* Footer summary */}
      {footerCount && (
        <ModuleTableFooterCount
          selectedCount={selectedSet.size}
          selectedCountLabel={footerCount.selectedCountLabel ?? ""}
          pageCountLabel={footerCount.pageCountLabel ?? ""}
        />
      )}
    </div>
  );
}
