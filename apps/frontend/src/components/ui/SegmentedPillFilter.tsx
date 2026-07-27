import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SegmentedPillOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedPillFilterProps<T extends string> {
  options: readonly SegmentedPillOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Reusable segmented pill button group filter component.
 */
export function SegmentedPillFilter<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedPillFilterProps<T>): React.JSX.Element {
  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <div className={cn('flex rounded-lg border border-border bg-muted/40 p-0.5', className)} role="group">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-auto rounded-md font-bold uppercase shadow-none',
              paddingClass,
              isSelected
                ? 'bg-background shadow-xs text-foreground hover:bg-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export default SegmentedPillFilter;
