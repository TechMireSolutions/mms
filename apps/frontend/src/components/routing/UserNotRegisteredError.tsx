import React from 'react';
import useTranslation from '@/hooks/useTranslation';

/** Shown when auth succeeds but the user is not registered in the tenant. */
export default function UserNotRegisteredError(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg border border-border">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-destructive/10">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{t('auth.userNotRegistered.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('auth.userNotRegistered.message')}</p>
          <div className="p-4 bg-muted/50 rounded-md text-sm text-muted-foreground text-left">
            <p>{t('auth.userNotRegistered.helpIntro')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('auth.userNotRegistered.verifyAccount')}</li>
              <li>{t('auth.userNotRegistered.contactAdmin')}</li>
              <li>{t('auth.userNotRegistered.tryLogout')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
