import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  WORK_TOOLBAR_TRIGGER,
  WORK_TOOLBAR_TRIGGER_ACTIVE,
  WORK_TOOLBAR_TRIGGER_IDLE,
} from '@/components/ui/formStyles';
import { cn } from '@/lib/utils';

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
      className={cn(
        WORK_TOOLBAR_TRIGGER,
        showDeleted ? WORK_TOOLBAR_TRIGGER_ACTIVE : WORK_TOOLBAR_TRIGGER_IDLE,
        className,
      )}
    >
      <Archive className="h-3.5 w-3.5" aria-hidden="true" />
      {showDeleted ? showActiveLabel : showDeletedLabel}
    </Button>
  );
}
