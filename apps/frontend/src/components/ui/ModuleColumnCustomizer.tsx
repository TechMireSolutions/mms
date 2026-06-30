import React, { useState, useMemo } from 'react';
import { Settings2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ModuleColumnRegistryEntry } from '@mms/shared';

export interface ModuleColumnCustomizerLabels {
  trigger: string;
  title: string;
  visibleAndOrder: string;
  hidden: string;
  fixed: string;
  hideColumn: (label: string) => string;
}

export interface ModuleColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  labels: ModuleColumnCustomizerLabels;
}

/** Per-user Work directory column layout picker (globle1 §3.4). */
export function ModuleColumnCustomizer({
  columnRegistry,
  updateUserColumnLayout,
  labels,
}: ModuleColumnCustomizerProps): React.JSX.Element {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const visibleColumns = useMemo(
    () => [...columnRegistry].filter((c) => c.enabled).sort((a, b) => a.order - b.order),
    [columnRegistry],
  );

  const hiddenColumns = useMemo(
    () => [...columnRegistry].filter((c) => !c.enabled),
    [columnRegistry],
  );

  const toggle = (id: string): void => {
    const updated = columnRegistry.map((c) => {
      if (c.key === id) {
        if (c.fixed) return c;
        return { ...c, enabled: !c.enabled };
      }
      return c;
    });
    updateUserColumnLayout(updated);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string): void => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string): void => {
    e.preventDefault();
    if (id !== dragging) setDragOver(id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string): void => {
    e.preventDefault();
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const visibleIds = visibleColumns.map((c) => c.key);
    const fromIdx = visibleIds.indexOf(dragging);
    const toIdx = visibleIds.indexOf(targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newVisibleIds = [...visibleIds];
      const [moved] = newVisibleIds.splice(fromIdx, 1);
      newVisibleIds.splice(toIdx, 0, moved);
      const updated = columnRegistry.map((c) => {
        const orderIdx = newVisibleIds.indexOf(c.key);
        if (orderIdx !== -1) {
          return { ...c, order: orderIdx };
        }
        return c;
      });
      updateUserColumnLayout(updated);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>{labels.trigger}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{labels.title}</h4>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            {labels.visibleAndOrder}
          </span>
          {visibleColumns.map((col) => (
            <div
              key={col.key}
              draggable={!col.fixed}
              onDragStart={(e) => !col.fixed && handleDragStart(e, col.key)}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
              onDragEnd={() => {
                setDragging(null);
                setDragOver(null);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all select-none ${
                dragging === col.key
                  ? 'opacity-40'
                  : dragOver === col.key
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted'
              }`}
            >
              <GripVertical
                className={`w-3.5 h-3.5 flex-shrink-0 ${col.fixed ? 'opacity-20' : 'text-muted-foreground cursor-grab'}`}
              />
              <span className="flex-1 text-sm text-foreground text-left">{col.label}</span>
              {col.fixed ? (
                <span className="text-[10px] text-muted-foreground">{labels.fixed}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(col.key)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={labels.hideColumn(col.label)}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {hiddenColumns.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {labels.hidden}
            </span>
            {hiddenColumns.map((col) => (
              <button
                type="button"
                key={col.key}
                onClick={() => toggle(col.key)}
                className="flex items-center gap-2 w-full px-2.5 min-h-[44px] rounded-lg hover:bg-muted transition-colors text-left"
              >
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{col.label}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
