import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModuleTrashToggleProps {
  showDeleted: boolean;
  onToggle: () => void;
  showActiveLabel: string;
  showDeletedLabel: string;
  className?: string;
}

/**
 * Work-tier trash/archive toggle used across soft-delete modules.
 */
export function ModuleTrashToggle({
  showDeleted,
  onToggle,
  showActiveLabel,
  showDeletedLabel,
  className,
}: ModuleTrashToggleProps) {
  return (
    <Button
      type="button"
      variant={showDeleted ? 'default' : 'outline'}
      onClick={onToggle}
      aria-pressed={showDeleted}
      className={className}
    >
      <Archive className="h-3.5 w-3.5" aria-hidden="true" />
      {showDeleted ? showActiveLabel : showDeletedLabel}
    </Button>
  );
}
