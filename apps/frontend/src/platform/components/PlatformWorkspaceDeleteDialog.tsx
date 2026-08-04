import { Loader2 } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { FieldErrorMessage } from '@/components/ui/FormField';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PasswordInput from '@/components/ui/PasswordInput';

interface PlatformWorkspaceDeleteDialogProps {
  workspace: PlatformWorkspaceRowData;
  appDomain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmSubdomain: string;
  onConfirmSubdomainChange: (value: string) => void;
  passwordError: string | null;
  deletePending: boolean;
  onConfirm: () => void;
}

export function PlatformWorkspaceDeleteDialog({
  workspace,
  appDomain,
  open,
  onOpenChange,
  password,
  onPasswordChange,
  confirmSubdomain,
  onConfirmSubdomainChange,
  passwordError,
  deletePending,
  onConfirm,
}: PlatformWorkspaceDeleteDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const confirmId = `delete-subdomain-${workspace.subdomain}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive font-bold">{t('platform.deleteWorkspaceTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('platform.deleteWorkspaceDesc', {
              name: workspace.madrasaName,
              subdomain: workspace.subdomain,
              domain: appDomain,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2.5 my-2 text-start">
          <div className="space-y-1.5">
            <label htmlFor={confirmId} className={FORM_LABEL}>
              {t('platform.deleteWorkspaceConfirmSubdomain', { subdomain: workspace.subdomain })}
            </label>
            <Input
              id={confirmId}
              name="confirmSubdomain"
              type="text"
              value={confirmSubdomain}
              onChange={(event) => onConfirmSubdomainChange(event.target.value)}
              disabled={deletePending}
              className="min-h-11"
              autoComplete="off"
            />
          </div>
          <PasswordInput
            id={`delete-pw-${workspace.subdomain}`}
            label={t('platform.profileCurrentPassword')}
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={deletePending}
          />
          <p className="text-xs text-muted-foreground">{t('platform.deleteWorkspacePasswordHint')}</p>
          {passwordError ? (
            <FieldErrorMessage message={passwordError} />
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePending}>{t('common.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={
              deletePending
              || !password.trim()
              || confirmSubdomain.trim().toLowerCase() !== workspace.subdomain.toLowerCase()
            }
            onClick={onConfirm}
          >
            {deletePending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                {t('platform.deleteWorkspaceConfirm')}
              </>
            ) : (
              t('platform.deleteWorkspaceConfirm')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
