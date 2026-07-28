import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AuthCardShell, AuthPageFrame } from '@/components/entry/AuthPageShell';
import { Button } from '@/components/ui/button';

/** Shown when auth succeeds but the user is not registered in the tenant. */
export default function UserNotRegisteredError(): React.JSX.Element {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <AuthPageFrame>
      <AuthCardShell
        className="max-w-md"
        header={
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t('auth.userNotRegistered.title')}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('auth.userNotRegistered.message')}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-start text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('auth.userNotRegistered.helpIntro')}</p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>{t('auth.userNotRegistered.verifyAccount')}</li>
              <li>{t('auth.userNotRegistered.contactAdmin')}</li>
              <li>{t('auth.userNotRegistered.tryLogout')}</li>
            </ul>
          </div>

          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-xl font-semibold"
            onClick={() => logout(true)}
          >
            {t('auth.signOut')}
          </Button>
        </div>
      </AuthCardShell>
    </AuthPageFrame>
  );
}
