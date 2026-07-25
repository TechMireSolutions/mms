import React from 'react';

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
    <div className={`flex rounded-lg border border-border bg-muted/40 p-0.5 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${paddingClass} rounded-md font-bold uppercase transition-all cursor-pointer ${
              isSelected
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedPillFilter;
