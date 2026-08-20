import React from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormModalFooterProps {
  footerStart?: React.ReactNode;
  cancelLabel: string;
  saveLabel: string;
  savedLabel?: string;
  onClose: () => void;
  onSave?: () => void | Promise<void>;
  saving: boolean;
  saveDisabled: boolean;
  saved: boolean;
}

export const FormModalFooter = React.memo(function FormModalFooter({
  footerStart,
  cancelLabel,
  saveLabel,
  savedLabel,
  onClose,
  onSave,
  saving,
  saveDisabled,
  saved,
}: FormModalFooterProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center',
        footerStart ? 'justify-between' : 'justify-end',
      )}
    >
      {footerStart ? <div className="min-w-0 sm:flex-1">{footerStart}</div> : null}
      <div className="ms-auto flex items-center gap-2.5">
        <Button type="button" variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={saving || saveDisabled || saved}
          className="min-w-filter-sm"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {savedLabel ?? saveLabel}
            </>
          ) : saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {saveLabel}
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" aria-hidden />
              {saveLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

