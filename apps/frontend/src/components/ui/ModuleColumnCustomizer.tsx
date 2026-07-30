import React, { useState, useMemo } from 'react';
import { Settings2, Search, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModuleColumnCustomizerList } from '@/components/ui/ModuleColumnCustomizerList';
import type {
  ModuleColumnCustomizerLabels,
  ModuleColumnCustomizerProps,
} from '@/components/ui/moduleColumnCustomizerTypes';

export type { ModuleColumnCustomizerLabels, ModuleColumnCustomizerProps };

/** Per-user Work directory column layout picker (globle1 §3.4). */
export function ModuleColumnCustomizer({
  columnRegistry,
  updateUserColumnLayout,
  onResetLayout,
  labels,
}: ModuleColumnCustomizerProps): React.JSX.Element {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="flex items-center gap-1.5 px-3 min-h-11 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>{labels.trigger}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="min-w-0 text-xs font-bold text-foreground uppercase tracking-wide">{labels.title}</h4>
          {onResetLayout && (
            <Button
              type="button"
              variant="ghost"
              onClick={onResetLayout}
              className="min-h-11 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1"
              title={labels.reset || 'Reset to defaults'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{labels.reset || 'Reset'}</span>
            </Button>
          )}
        </div>

        {columnRegistry.length > 6 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder || 'Filter columns...'}
              className="min-h-11 ps-8 text-xs bg-muted/30 border-border/60"
            />
          </div>
        )}

        <ModuleColumnCustomizerList
          visibleColumns={visibleColumns}
          hiddenColumns={hiddenColumns}
          dragging={dragging}
          dragOver={dragOver}
          labels={labels}
          toggle={toggle}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          clearDrag={clearDrag}
        />
      </PopoverContent>
    </Popover>
  );
}
