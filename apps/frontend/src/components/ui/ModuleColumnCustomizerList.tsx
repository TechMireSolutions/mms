import React from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import type { ModuleColumnCustomizerListProps } from '@/components/ui/moduleColumnCustomizerTypes';
import { cn } from '@/lib/utils';

export type { ModuleColumnCustomizerListProps };

export const ModuleColumnCustomizerList = React.memo(function ModuleColumnCustomizerList({
  visibleColumns,
  hiddenColumns,
  dragging,
  dragOver,
  labels,
  toggle,
  handleDragStart,
  handleDragOver,
  handleDrop,
  clearDrag,
}: ModuleColumnCustomizerListProps): React.JSX.Element {
  return (
    <div className="max-h-72 overflow-y-auto pe-1 space-y-3">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          {labels.visibleAndOrder}
        </span>
        {visibleColumns.map((col) => (
          <div
            key={col.key}
            draggable={!col.fixed}
            onDragStart={(event) => !col.fixed && handleDragStart(event, col.key)}
            onDragOver={(event) => handleDragOver(event, col.key)}
            onDrop={(event) => handleDrop(event, col.key)}
            onDragEnd={clearDrag}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all select-none border-transparent hover:bg-muted',
              dragging === col.key && 'opacity-40',
              dragOver === col.key && 'border-primary bg-primary/5',
            )}
          >
            <GripVertical
              className={cn(
                'w-3.5 h-3.5 flex-shrink-0',
                col.fixed ? 'opacity-20' : 'text-muted-foreground cursor-grab',
              )}
            />
            <span className="flex-1 text-sm text-foreground text-start">{col.label}</span>
            {col.fixed ? (
              <span className="text-xs text-muted-foreground">{labels.fixed}</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(col.key);
                }}
                className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer"
                aria-label={labels.hideColumn(col.label)}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      {hiddenColumns.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {labels.hidden}
          </span>
          {hiddenColumns.map((col) => (
            <button
              type="button"
              key={col.key}
              onClick={(e) => {
                e.stopPropagation();
                toggle(col.key);
              }}
              aria-label={labels.showColumn ? labels.showColumn(col.label) : undefined}
              className="flex items-center justify-between w-full px-2.5 min-h-11 rounded-lg border border-transparent hover:bg-muted transition-colors text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{col.label}</span>
              </div>
              <Eye className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
