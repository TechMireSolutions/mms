import { Loader2 } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
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
  passwordError,
  deletePending,
  onConfirm,
}: PlatformWorkspaceDeleteDialogProps): React.JSX.Element {
  const { t } = useTranslation();

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
        <div className="space-y-2.5 my-2">
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
            <p className="text-xs text-destructive font-semibold" role="alert">
              {passwordError}
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePending}>{t('common.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deletePending || !password.trim()}
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
