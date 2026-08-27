import React, { useState, useMemo } from 'react';
import { Columns3, Search, RotateCcw, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModuleColumnCustomizerList } from '@/components/ui/ModuleColumnCustomizerList';
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type {
  ModuleColumnCustomizerLabels,
  ModuleColumnCustomizerProps,
} from '@/components/ui/moduleColumnCustomizerTypes';

export type { ModuleColumnCustomizerLabels, ModuleColumnCustomizerProps };

/** Per-user Work directory column layout picker (globle1 §3.4). */
export const ModuleColumnCustomizer = React.memo(function ModuleColumnCustomizer({
  columnRegistry,
  updateUserColumnLayout,
  onResetLayout,
  labels,
  className,
  disabled = false,
}: ModuleColumnCustomizerProps): React.JSX.Element {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const resolvedLabels = useMemo<ModuleColumnCustomizerLabels>(() => ({
    trigger: labels?.trigger ?? t('common.columns.trigger'),
    title: labels?.title ?? t('common.columns.title'),
    visibleAndOrder: labels?.visibleAndOrder ?? t('common.columns.visibleAndOrder'),
    hidden: labels?.hidden ?? t('common.columns.hidden'),
    fixed: labels?.fixed ?? t('common.columns.fixed'),
    hideColumn: labels?.hideColumn ?? ((label: string) => t('common.columns.hideColumn', { label })),
    showColumn: labels?.showColumn ?? ((label: string) => t('common.columns.showColumn', { label })),
    reset: labels?.reset ?? t('common.columns.reset'),
    searchPlaceholder: labels?.searchPlaceholder ?? t('common.columns.searchPlaceholder'),
    showAll: labels?.showAll ?? t('common.columns.showAll'),
    hideAll: labels?.hideAll ?? t('common.columns.hideAll'),
    visibleCount: labels?.visibleCount ?? ((visible: number, total: number) => t('common.columns.visibleCount', { visible, total })),
    noMatches: labels?.noMatches ?? t('common.columns.noMatches'),
  }), [labels, t]);

  const visibleColumns = useMemo(
    () =>
      [...columnRegistry]
        .filter((column) => column.enabled)
        .sort((firstColumn, secondColumn) => firstColumn.order - secondColumn.order)
        .filter((column) => !searchQuery || column.label.toLowerCase().includes(searchQuery.toLowerCase())),
    [columnRegistry, searchQuery],
  );

  const hiddenColumns = useMemo(
    () =>
      [...columnRegistry]
        .filter((column) => !column.enabled)
        .filter((column) => !searchQuery || column.label.toLowerCase().includes(searchQuery.toLowerCase())),
    [columnRegistry, searchQuery],
  );

  const toggle = (columnKey: string): void => {
    const updated = columnRegistry.map((column) => {
      if (column.key === columnKey) {
        if (column.fixed) return column;
        return { ...column, enabled: !column.enabled };
      }
      return column;
    });
    updateUserColumnLayout(updated);
  };

  const showAll = (): void => {
    const updated = columnRegistry.map((column) => ({ ...column, enabled: true }));
    updateUserColumnLayout(updated);
  };

  const hideAll = (): void => {
    const updated = columnRegistry.map((column) => (column.fixed ? column : { ...column, enabled: false }));
    updateUserColumnLayout(updated);
  };

  const hasNonFixedHidden = columnRegistry.some((c) => !c.enabled && !c.fixed);
  const hasNonFixedVisible = columnRegistry.some((c) => c.enabled && !c.fixed);
  const hiddenCount = columnRegistry.filter((c) => !c.enabled && !c.fixed).length;

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, columnKey: string): void => {
    setDragging(columnKey);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, columnKey: string): void => {
    event.preventDefault();
    if (columnKey !== dragging) setDragOver(columnKey);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetColumnKey: string): void => {
    event.preventDefault();
    if (!dragging || dragging === targetColumnKey) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const allVisible = [...columnRegistry].filter((col) => col.enabled).sort((a, b) => a.order - b.order);
    const visibleIds = allVisible.map((column) => column.key);
    const fromIdx = visibleIds.indexOf(dragging);
    const toIdx = visibleIds.indexOf(targetColumnKey);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newVisibleIds = [...visibleIds];
      const [moved] = newVisibleIds.splice(fromIdx, 1);
      newVisibleIds.splice(toIdx, 0, moved);
      const updated = columnRegistry.map((column) => {
        const orderIdx = newVisibleIds.indexOf(column.key);
        if (orderIdx !== -1) {
          return { ...column, order: orderIdx };
        }
        return column;
      });
      updateUserColumnLayout(updated);
    }
    setDragging(null);
    setDragOver(null);
  };

  const clearDrag = (): void => {
    setDragging(null);
    setDragOver(null);
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down'): void => {
    const allVisible = [...columnRegistry].filter((col) => col.enabled).sort((a, b) => a.order - b.order);
    const visibleIds = allVisible.map((column) => column.key);
    const fromIdx = visibleIds.indexOf(columnKey);
    if (fromIdx === -1) return;
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= visibleIds.length) return;

    const newVisibleIds = [...visibleIds];
    const [moved] = newVisibleIds.splice(fromIdx, 1);
    if (!moved) return;
    newVisibleIds.splice(toIdx, 0, moved);
    const updated = columnRegistry.map((column) => {
      const orderIdx = newVisibleIds.indexOf(column.key);
      if (orderIdx !== -1) {
        return { ...column, order: orderIdx };
      }
      return column;
    });
    updateUserColumnLayout(updated);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(WORK_TOOLBAR_TRIGGER, WORK_TOOLBAR_TRIGGER_IDLE, className)}
          aria-label={resolvedLabels.trigger}
        >
          <Columns3 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{resolvedLabels.trigger}</span>
          {hiddenCount > 0 && (
            <span className="ms-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {columnRegistry.length - hiddenCount}/{columnRegistry.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-76 p-3 space-y-3 rounded-xl shadow-lg border border-border/80">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="min-w-0 text-xs font-bold text-foreground uppercase tracking-wide">
              {resolvedLabels.title}
            </h4>
            <span className="text-[11px] text-muted-foreground font-medium">
              ({resolvedLabels.visibleCount ? resolvedLabels.visibleCount(columnRegistry.length - hiddenCount, columnRegistry.length) : `${columnRegistry.length - hiddenCount}/${columnRegistry.length}`})
            </span>
          </div>
          {onResetLayout && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetLayout}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1"
              title={resolvedLabels.reset}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{resolvedLabels.reset}</span>
            </Button>
          )}
        </div>

        {columnRegistry.length > 5 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={resolvedLabels.searchPlaceholder}
              className="h-8 ps-8 pe-7 text-xs bg-muted/30 border-border/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <ModuleColumnCustomizerList
          visibleColumns={visibleColumns}
          hiddenColumns={hiddenColumns}
          dragging={dragging}
          dragOver={dragOver}
          labels={resolvedLabels}
          toggle={toggle}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          clearDrag={clearDrag}
          onMoveColumn={moveColumn}
          showAll={showAll}
          hideAll={hideAll}
          hasNonFixedHidden={hasNonFixedHidden}
          hasNonFixedVisible={hasNonFixedVisible}
          isSearching={Boolean(searchQuery)}
        />
      </PopoverContent>
    </Popover>
  );
});

