import React, { useId } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/ui/PasswordInput';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { FORM_LABEL } from '@/components/ui/formStyles';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface PlatformTypedConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Expected confirmation string (literal token or subdomain). */
  expectedConfirm: string;
  confirmValue: string;
  onConfirmValueChange: (value: string) => void;
  confirmInputName?: string;
  confirmPlaceholder?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordInputId: string;
  passwordInputName?: string;
  passwordHint?: string;
  error: string | null;
  pending: boolean;
  confirmButtonLabel: string;
  confirmVariant?: 'default' | 'destructive';
  /** How confirm text must match `expectedConfirm`. Default: exact. */
  confirmMatch?: 'exact' | 'caseInsensitive';
  destructiveTitle?: boolean;
  onConfirm: () => void;
}

function confirmMatches(
  value: string,
  expected: string,
  mode: 'exact' | 'caseInsensitive',
): boolean {
  if (mode === 'caseInsensitive') {
    return value.trim().toLowerCase() === expected.trim().toLowerCase();
  }
  return value.trim() === expected;
}

/**
 * Presentational typed-confirm + password step-up dialog for platform danger ops.
 * Blocks dismiss while `pending`. No mutations — callers own controllers.
 */
export function PlatformTypedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  expectedConfirm,
  confirmValue,
  onConfirmValueChange,
  confirmInputName = 'confirmText',
  confirmPlaceholder,
  password,
  onPasswordChange,
  passwordInputId,
  passwordInputName = 'currentPassword',
  passwordHint,
  error,
  pending,
  confirmButtonLabel,
  confirmVariant = 'destructive',
  confirmMatch = 'exact',
  destructiveTitle = true,
  onConfirm,
}: PlatformTypedConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const confirmInputId = useId();
  const matches = confirmMatches(confirmValue, expectedConfirm, confirmMatch);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={destructiveTitle ? 'text-destructive font-bold' : 'font-bold'}
          >
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 my-2 text-start">
          <div className="space-y-1.5">
            <label htmlFor={confirmInputId} className={FORM_LABEL}>
              {confirmLabel}
            </label>
            <Input
              id={confirmInputId}
              name={confirmInputName}
              type="text"
              value={confirmValue}
              onChange={(event) => onConfirmValueChange(event.target.value)}
              placeholder={confirmPlaceholder}
              disabled={pending}
              className="min-h-11"
              autoComplete="off"
            />
          </div>
          <PasswordInput
            id={passwordInputId}
            name={passwordInputName}
            label={t('platform.profileCurrentPassword')}
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={pending}
          />
          {passwordHint ? (
            <p className="text-xs text-muted-foreground">{passwordHint}</p>
          ) : null}
          {error ? <FieldErrorMessage message={error} /> : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="min-h-11 rounded-xl font-bold">
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={pending || !matches || !password.trim()}
            onClick={onConfirm}
            className="min-h-11 rounded-xl font-bold"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                {confirmButtonLabel}
              </>
            ) : (
              confirmButtonLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
