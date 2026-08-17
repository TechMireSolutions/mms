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
  const paddingClass = size === 'sm' ? 'px-2 py-2 text-xs' : 'px-3 py-2 text-xs';

  return (
    <div className={cn('flex w-full max-w-full overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5 sm:w-auto', className)} role="group">
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
              'min-h-11 h-auto shrink-0 rounded-md font-bold uppercase shadow-none',
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
