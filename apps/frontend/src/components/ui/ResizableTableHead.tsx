import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { clampModuleColumnWidth } from '@mms/shared';

export interface ResizableTableHeadProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'children'> {
  columnKey: string;
  width?: number;
  onResize?: (columnKey: string, width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
}

/**
 * Work-directory table header with an end-edge drag handle to persist column width.
 */
export function ResizableTableHead({
  columnKey,
  width,
  onResize,
  minWidth = 80,
  maxWidth = 640,
  children,
  className,
  style,
  ...props
}: ResizableTableHeadProps): React.JSX.Element {
  const { t, isRtl } = useTranslation();
  const thRef = useRef<HTMLTableCellElement>(null);
  const [draftWidth, setDraftWidth] = useState<number | null>(null);
  const resizingRef = useRef(false);

  const resolvedWidth = draftWidth ?? width;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (!onResize) return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth =
        resolvedWidth ??
        thRef.current?.getBoundingClientRect().width ??
        minWidth;
      resizingRef.current = true;
      setDraftWidth(startWidth);

      const previousUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = 'none';

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!resizingRef.current) return;
        const rawDelta = moveEvent.clientX - startX;
        const delta = isRtl ? -rawDelta : rawDelta;
        const nextWidth = clampModuleColumnWidth(
          Math.min(maxWidth, Math.max(minWidth, startWidth + delta)),
        );
        setDraftWidth(nextWidth);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        if (!resizingRef.current) return;
        resizingRef.current = false;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        const rawDelta = upEvent.clientX - startX;
        const delta = isRtl ? -rawDelta : rawDelta;
        const nextWidth = clampModuleColumnWidth(
          Math.min(maxWidth, Math.max(minWidth, startWidth + delta)),
        );
        setDraftWidth(null);
        onResize(columnKey, nextWidth);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [columnKey, isRtl, maxWidth, minWidth, onResize, resolvedWidth],
  );

  return (
    <th
      ref={thRef}
      className={cn('relative', className)}
      style={{
        ...style,
        ...(typeof resolvedWidth === 'number'
          ? { width: resolvedWidth, minWidth: resolvedWidth, maxWidth: resolvedWidth }
          : undefined),
      }}
      {...props}
    >
      {children}
      {onResize ? (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={t('table.resizeColumn')}
          onPointerDown={handlePointerDown}
          onClick={(event) => event.stopPropagation()}
          className="absolute inset-y-0 end-0 z-10 flex w-11 min-w-11 cursor-col-resize select-none items-stretch justify-end after:absolute after:inset-y-1 after:end-0 after:w-px after:bg-border/70 hover:after:bg-primary/60"
        />
      ) : null}
    </th>
  );
}
